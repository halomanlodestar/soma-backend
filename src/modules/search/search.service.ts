import { BadRequestException, Injectable } from '@nestjs/common';
import { Prisma } from '../../prisma/generated/client';
import { PrismaService } from '../../prisma/prisma.service';
import { AutocompleteInput, SearchInput } from './dto/search.inputs';
import { AutocompleteResult } from './entities/autocomplete-result.entity';
import { SearchConnection } from './entities/search-connection.entity';
import { SearchResult } from './entities/search-result.entity';
import { SearchCursor } from './types/search-cursor.type';
import { SearchResultKind } from './types/search-result-kind.enum';

type SearchRow = SearchResult & { rank: number };
type CountRow = { totalCount: bigint };

const postDocument = Prisma.sql`
  setweight(to_tsvector('english', coalesce(p.title, '')), 'A') ||
  setweight(to_tsvector('english', coalesce(p.excerpt, '')), 'B') ||
  setweight(to_tsvector('english', coalesce(p.body, '')), 'C')
`;
const somaDocument = Prisma.sql`
  setweight(to_tsvector('english', coalesce(s.name, '')), 'A') ||
  setweight(to_tsvector('english', coalesce(s.description, '')), 'B')
`;
const creatorDocument = Prisma.sql`
  setweight(to_tsvector('english', coalesce(u.username, '')), 'A') ||
  setweight(to_tsvector('english', coalesce(u.display_name, '')), 'A') ||
  setweight(to_tsvector('english', coalesce(u.bio, '')), 'B')
`;

@Injectable()
export class SearchService {
  constructor(private readonly prisma: PrismaService) {}

  async search(input: SearchInput): Promise<SearchConnection> {
    const query = input.query.trim();
    if (query.length < 2) {
      throw new BadRequestException(
        'Search queries must contain two characters.',
      );
    }

    const cursor = input.after ? this.decodeCursor(input.after) : null;
    const cursorFilter = cursor
      ? Prisma.sql`
          WHERE rank < ${cursor.rank}
            OR (
              rank = ${cursor.rank}
              AND (
                kind > ${cursor.kind}
                OR (kind = ${cursor.kind} AND id < ${cursor.id})
              )
            )
        `
      : Prisma.empty;

    const resultSet = Prisma.sql`
      SELECT
        p.id::text AS id,
        'POST'::text AS kind,
        p.title,
        coalesce(p.excerpt, left(p.body, 180)) AS subtitle,
        NULL::text AS slug,
        p.media_url AS "imageUrl",
        ts_rank_cd(${postDocument}, search_query.query)::float8 AS rank
      FROM posts p
      CROSS JOIN search_query
      WHERE p.visibility = 'PUBLISHED'
        AND ${postDocument} @@ search_query.query

      UNION ALL

      SELECT
        s.id::text AS id,
        'SOMA'::text AS kind,
        s.name AS title,
        s.description AS subtitle,
        s.slug,
        s.cover_url AS "imageUrl",
        ts_rank_cd(${somaDocument}, search_query.query)::float8 AS rank
      FROM somas s
      CROSS JOIN search_query
      WHERE ${somaDocument} @@ search_query.query

      UNION ALL

      SELECT
        u.id::text AS id,
        'CREATOR'::text AS kind,
        coalesce(u.display_name, u.username) AS title,
        coalesce(u.bio, '@' || u.username) AS subtitle,
        u.username AS slug,
        u.avatar_url AS "imageUrl",
        ts_rank_cd(${creatorDocument}, search_query.query)::float8 AS rank
      FROM users u
      CROSS JOIN search_query
      WHERE ${creatorDocument} @@ search_query.query
    `;

    const [rows, countRows] = await Promise.all([
      this.prisma.$queryRaw<SearchRow[]>(Prisma.sql`
        WITH search_query AS (
          SELECT websearch_to_tsquery('english', ${query}) AS query
        ), results AS (${resultSet})
        SELECT *
        FROM results
        ${cursorFilter}
        ORDER BY rank DESC, kind ASC, id DESC
        LIMIT ${input.first + 1}
      `),
      this.prisma.$queryRaw<CountRow[]>(Prisma.sql`
        WITH search_query AS (
          SELECT websearch_to_tsquery('english', ${query}) AS query
        ), results AS (${resultSet})
        SELECT count(*)::bigint AS "totalCount"
        FROM results
      `),
    ]);

    const nodes = rows.slice(0, input.first);
    const start = nodes[0];
    const end = nodes.at(-1);
    return {
      nodes,
      totalCount: Number(countRows[0]?.totalCount ?? 0),
      pageInfo: {
        hasNextPage: rows.length > input.first,
        hasPreviousPage: Boolean(cursor),
        startCursor: start ? this.encodeCursor(start) : null,
        endCursor: end ? this.encodeCursor(end) : null,
      },
    };
  }

  async autocomplete(input: AutocompleteInput): Promise<AutocompleteResult[]> {
    const query = input.query.trim().toLowerCase();
    if (query.length < 2) return [];

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
      kind: SearchResultKind.CREATOR,
      id: creator.id,
      title: creator.displayName ?? creator.username,
      subtitle: `@${creator.username}`,
      slug: creator.username,
      imageUrl: creator.avatarUrl,
    }));
    const somaResults = somas.map((soma) => ({
      kind: SearchResultKind.SOMA,
      id: soma.id,
      title: soma.name,
      subtitle: null,
      slug: soma.slug,
      imageUrl: soma.coverUrl,
    }));
    const postResults = posts.map((post) => ({
      kind: SearchResultKind.POST,
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

  private encodeCursor(row: Pick<SearchRow, 'rank' | 'kind' | 'id'>): string {
    return Buffer.from(
      JSON.stringify({ rank: row.rank, kind: row.kind, id: row.id }),
    ).toString('base64url');
  }

  private decodeCursor(value: string): SearchCursor {
    try {
      const cursor = JSON.parse(
        Buffer.from(value, 'base64url').toString('utf8'),
      ) as SearchCursor;
      if (
        typeof cursor.rank !== 'number' ||
        !Number.isFinite(cursor.rank) ||
        typeof cursor.kind !== 'string' ||
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
