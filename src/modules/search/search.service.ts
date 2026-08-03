import { BadRequestException, Injectable } from '@nestjs/common';
import { Prisma } from '../../prisma/generated/client';
import { PrismaService } from '../../prisma/prisma.service';
import { AutocompleteInput, SearchPostsInput } from './dto/search.inputs';
import {
  AutocompleteResult,
  AutocompleteResultKind,
} from './entities/autocomplete-result.entity';
import { PostSearchConnection } from './entities/post-search-connection.entity';
import { PostSearchCursor } from './types/post-search-cursor.type';
import { CountRow, PostSearchRow } from './types/suppprting.type';

const postDocument = Prisma.sql`
  setweight(to_tsvector('english', coalesce(p.title, '')), 'A') ||
  setweight(to_tsvector('english', coalesce(p.excerpt, '')), 'B') ||
  setweight(to_tsvector('english', coalesce(p.body, '')), 'C')
`;

@Injectable()
export class SearchService {
  constructor(private readonly prisma: PrismaService) {}

  async searchPosts(input: SearchPostsInput): Promise<PostSearchConnection> {
    const query = input.query.trim();

    if (query.length < 2) {
      throw new BadRequestException(
        'Search queries must contain two characters.',
      );
    }

    const cursor = input.after ? this.decodeCursor(input.after) : null;
    const somaFilter = input.somaId
      ? Prisma.sql`AND p.soma_id = ${input.somaId}::uuid`
      : Prisma.empty;
    const cursorFilter = cursor
      ? Prisma.sql`
          AND (
            ts_rank_cd(${postDocument}, search_query.query) < ${cursor.rank}
            OR (
              ts_rank_cd(${postDocument}, search_query.query) = ${cursor.rank}
              AND p.id < ${cursor.id}::uuid
            )
          )
        `
      : Prisma.empty;

    const [rows, countRows] = await Promise.all([
      this.prisma.$queryRaw<PostSearchRow[]>(Prisma.sql`
        WITH search_query AS (
          SELECT websearch_to_tsquery('english', ${query}) AS query
        )
        SELECT
          p.id,
          p.title,
          p.body,
          p.excerpt,
          p.media_url AS "mediaUrl",
          p.author_id AS "authorId",
          p.soma_id AS "somaId",
          p.impressions,
          p.visibility,
          p.media_status AS "mediaStatus",
          p.vote_count AS "voteCount",
          p.comment_count AS "commentCount",
          p.created_at AS "createdAt",
          p.updated_at AS "updatedAt",
          ts_rank_cd(${postDocument}, search_query.query)::float8 AS rank
        FROM posts p
        CROSS JOIN search_query
        WHERE p.visibility = 'PUBLISHED'
          AND ${postDocument} @@ search_query.query
          ${somaFilter}
          ${cursorFilter}
        ORDER BY rank DESC, p.id DESC
        LIMIT ${input.first + 1}
      `),

      this.prisma.$queryRaw<CountRow[]>(Prisma.sql`
        WITH search_query AS (
          SELECT websearch_to_tsquery('english', ${query}) AS query
        )
        SELECT count(*)::bigint AS "totalCount"
        FROM posts p
        CROSS JOIN search_query
        WHERE p.visibility = 'PUBLISHED'
          AND ${postDocument} @@ search_query.query
          ${somaFilter}
      `),
    ]);

    const hasNextPage = rows.length > input.first;
    const nodes = rows.slice(0, input.first);
    const start = nodes[0];
    const end = nodes.at(-1);

    return {
      nodes,
      totalCount: Number(countRows[0]?.totalCount ?? 0),
      pageInfo: {
        hasNextPage,
        hasPreviousPage: Boolean(cursor),
        startCursor: start ? this.encodeCursor(start) : null,
        endCursor: end ? this.encodeCursor(end) : null,
      },
    };
  }

  async autocomplete(input: AutocompleteInput): Promise<AutocompleteResult[]> {
    const query = input.query.trim().toLowerCase();

    if (query.length < 2) {
      return [];
    }

    const prefix = `${query}%`;
    const [posts, creators, somas] = await Promise.all([
      this.prisma.post.findMany({
        where: {
          visibility: 'PUBLISHED',
          title: { startsWith: query, mode: 'insensitive' },
        },
        select: { id: true, title: true, excerpt: true, mediaUrl: true },
        orderBy: { hotScore: 'desc' },
        take: input.first,
      }),
      this.prisma.$queryRaw<
        {
          id: string;
          username: string;
          displayName: string | null;
          avatarUrl: string | null;
        }[]
      >(Prisma.sql`
        SELECT id, username, display_name AS "displayName", avatar_url AS "avatarUrl"
        FROM users
        WHERE lower(username) LIKE ${prefix}
          OR lower(coalesce(display_name, '')) LIKE ${prefix}
        ORDER BY is_verified DESC, username ASC
        LIMIT ${input.first}
      `),
      this.prisma.$queryRaw<
        { id: string; name: string; slug: string; coverUrl: string | null }[]
      >(Prisma.sql`
        SELECT id, name, slug, cover_url AS "coverUrl"
        FROM somas
        WHERE lower(name) LIKE ${prefix}
          OR lower(slug) LIKE ${prefix}
        ORDER BY member_count DESC, name ASC
        LIMIT ${input.first}
      `),
    ]);

    const creatorResults = creators.map((creator) => ({
      kind: AutocompleteResultKind.CREATOR,
      id: creator.id,
      title: creator.displayName ?? creator.username,
      subtitle: `@${creator.username}`,
      slug: creator.username,
      imageUrl: creator.avatarUrl,
    }));
    const somaResults = somas.map((soma) => ({
      kind: AutocompleteResultKind.SOMA,
      id: soma.id,
      title: soma.name,
      subtitle: null,
      slug: soma.slug,
      imageUrl: soma.coverUrl,
    }));
    const postResults = posts.map((post) => ({
      kind: AutocompleteResultKind.POST,
      id: post.id,
      title: post.title,
      subtitle: post.excerpt,
      slug: null,
      imageUrl: post.mediaUrl,
    }));

    const results: AutocompleteResult[] = [];

    for (let index = 0; results.length < input.first; index += 1) {
      const next = [
        creatorResults[index],
        somaResults[index],
        postResults[index],
      ];

      if (next.every((item) => !item)) break;

      results.push(
        ...next.filter((item): item is AutocompleteResult => Boolean(item)),
      );
    }

    return results.slice(0, input.first);
  }

  private encodeCursor(row: Pick<PostSearchRow, 'rank' | 'id'>): string {
    return Buffer.from(JSON.stringify({ rank: row.rank, id: row.id })).toString(
      'base64url',
    );
  }

  private decodeCursor(value: string): PostSearchCursor {
    try {
      const cursor = JSON.parse(
        Buffer.from(value, 'base64url').toString('utf8'),
      ) as PostSearchCursor;

      if (
        typeof cursor.rank !== 'number' ||
        !Number.isFinite(cursor.rank) ||
        typeof cursor.id !== 'string'
      ) {
        throw new Error('Invalid cursor');
      }

      return cursor;
    } catch {
      throw new BadRequestException('Invalid search cursor.');
    }
  }
}
