import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { FeedQueryDto } from './dto/feed-query.dto';
import { FeedItem } from './entities/feed-item.entity';

@Injectable()
export class FeedService {
  constructor(private readonly prisma: PrismaService) {}

  async getGlobalFeed(query: FeedQueryDto): Promise<FeedItem[]> {
    return this.fetchFeed(query);
  }

  async getSomaFeed(somaId: string, query: FeedQueryDto): Promise<FeedItem[]> {
    return this.fetchFeed(query, { somaId });
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
            username: true,
            displayName: true,
            avatarUrl: true,
            coverUrl: true,
            isVerified: true,
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
      author: post.author,
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
}
