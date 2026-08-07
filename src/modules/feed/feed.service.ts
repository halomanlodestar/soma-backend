import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { FeedQueryDto } from './dto/feed-query.dto';
import { FeedConnectionQueryDto } from './dto/feed-connection-query.dto';
import { FeedItem } from './entities/feed-item.entity';
import { FeedConnection } from './entities/feed-connection.entity';
import { FeedCursor } from './types/feed-cursor.type';

@Injectable()
export class FeedService {
  constructor(private readonly prisma: PrismaService) {}

  async getGlobalFeed(query: FeedQueryDto): Promise<FeedItem[]> {
    return this.fetchFeed(query);
  }

  async getSomaFeed(somaId: string, query: FeedQueryDto): Promise<FeedItem[]> {
    return this.fetchFeed(query, { somaId });
  }

  async getGlobalFeedConnection(
    query: FeedConnectionQueryDto,
  ): Promise<FeedConnection> {
    return this.fetchFeedConnection(query);
  }

  async getSomaFeedConnection(
    somaId: string,
    query: FeedConnectionQueryDto,
  ): Promise<FeedConnection> {
    return this.fetchFeedConnection(query, { somaId });
  }

  private async fetchFeed(
    query: FeedQueryDto,
    where: { somaId?: string } = {},
  ): Promise<FeedItem[]> {
    const { limit = 20, cursor } = query;

    const posts = await this.prisma.post.findMany({
      where: { ...where, visibility: 'PUBLISHED' },
      take: limit,
      skip: cursor ? 1 : 0,
      cursor: cursor ? { id: cursor } : undefined,
      orderBy: { hotScore: 'desc' },
      include: {
        author: {
          select: {
            id: true,
            emailVerified: true,
            profile: {
              select: {
                username: true,
                displayName: true,
                avatarUrl: true,
                coverUrl: true,
              },
            },
          },
        },
        soma: {
          select: {
            id: true,
            slug: true,
            name: true,
            coverUrl: true,
            memberCount: true,
            weeklyVisitorCount: true,
          },
        },
        media: {
          include: {
            items: {
              select: { type: true, originalUrl: true },
            },
          },
        },
      },
    });

    /* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call */
    return posts.map((post: any) => ({
      id: post.id,
      title: post.title,
      body: post.body,
      excerpt: post.excerpt,
      mediaUrl: post.mediaUrl,
      createdAt: post.createdAt,
      author: this.toFeedAuthor(post.author),
      soma: post.soma,
      media: post.media
        ? {
            items: post.media.items.map((item) => ({
              type: item.type,
              originalUrl: item.originalUrl,
            })),
          }
        : null,
      voteCount: post.voteCount,
      commentCount: post.commentCount,
      awardCount: 0,
    }));
  }

  private async fetchFeedConnection(
    query: FeedConnectionQueryDto,
    where: { somaId?: string } = {},
  ): Promise<FeedConnection> {
    const after = query.after ? this.decodeCursor(query.after) : null;
    const filter = {
      ...where,
      visibility: 'PUBLISHED' as const,
      ...(after
        ? {
            OR: [
              { hotScore: { lt: after.hotScore } },
              { hotScore: after.hotScore, id: { lt: after.id } },
            ],
          }
        : {}),
    };

    const [posts, totalCount] = await Promise.all([
      this.prisma.post.findMany({
        where: filter,
        take: query.first + 1,
        orderBy: [{ hotScore: 'desc' }, { id: 'desc' }],
        include: {
          author: {
            select: {
              id: true,
              emailVerified: true,
              profile: {
                select: {
                  username: true,
                  displayName: true,
                  avatarUrl: true,
                  coverUrl: true,
                },
              },
            },
          },
          soma: {
            select: {
              id: true,
              slug: true,
              name: true,
              coverUrl: true,
              memberCount: true,
              weeklyVisitorCount: true,
            },
          },
          media: {
            include: {
              items: {
                select: { type: true, originalUrl: true },
              },
            },
          },
        },
      }),
      this.prisma.post.count({
        where: { ...where, visibility: 'PUBLISHED' },
      }),
    ]);

    const hasNextPage = posts.length > query.first;
    const pagePosts = posts.slice(0, query.first);
    const nodes = pagePosts.map((post) =>
      this.toFeedItem({ ...post, author: this.toFeedAuthor(post.author) }),
    );
    const cursors = pagePosts.map((post) =>
      this.encodeCursor({
        hotScore: post.hotScore,
        id: post.id,
      }),
    );

    return {
      nodes,
      totalCount,
      pageInfo: {
        hasNextPage,
        hasPreviousPage: Boolean(query.after),
        startCursor: cursors[0] ?? null,
        endCursor: cursors.at(-1) ?? null,
      },
    };
  }

  private encodeCursor(cursor: FeedCursor) {
    return Buffer.from(JSON.stringify(cursor)).toString('base64url');
  }

  private decodeCursor(value: string): FeedCursor {
    try {
      const cursor = JSON.parse(
        Buffer.from(value, 'base64url').toString('utf8'),
      ) as FeedCursor;
      if (
        typeof cursor.hotScore !== 'number' ||
        !Number.isFinite(cursor.hotScore) ||
        typeof cursor.id !== 'string'
      ) {
        throw new Error('Invalid cursor');
      }
      return cursor;
    } catch {
      throw new Error('Invalid feed cursor.');
    }
  }

  private toFeedItem(post: {
    id: string;
    title: string;
    body: string | null;
    excerpt: string | null;
    mediaUrl: string | null;
    createdAt: Date;
    author: FeedItem['author'];
    soma: FeedItem['soma'];
    media: { items: { type: string; originalUrl: string }[] } | null;
    voteCount: number;
    commentCount: number;
  }): FeedItem {
    return {
      id: post.id,
      title: post.title,
      body: post.body,
      excerpt: post.excerpt,
      mediaUrl: post.mediaUrl,
      createdAt: post.createdAt,
      author: post.author,
      soma: post.soma,
      media: post.media,
      voteCount: post.voteCount,
      commentCount: post.commentCount,
      awardCount: 0,
    };
  }

  private toFeedAuthor(author: {
    id: string;
    emailVerified: boolean;
    profile: {
      username: string;
      displayName: string | null;
      avatarUrl: string | null;
      coverUrl: string | null;
    } | null;
  }): FeedItem['author'] {
    if (!author.profile) throw new Error('Post author profile is missing.');

    return {
      id: author.id,
      username: author.profile.username,
      displayName: author.profile.displayName,
      avatarUrl: author.profile.avatarUrl,
      coverUrl: author.profile.coverUrl,
      isVerified: author.emailVerified,
    };
  }
}
