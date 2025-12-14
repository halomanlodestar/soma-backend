import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { FeedQueryDto } from './dto/feed-query.dto';
import { FeedItem } from './entities/feed-item.entity';
import { VoteTargetType, AwardTargetType } from '../../prisma/generated/client';

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
      where,
      take: limit,
      skip: cursor ? 1 : 0,
      cursor: cursor ? { id: cursor } : undefined,
      orderBy: { createdAt: 'desc' },
      include: {
        author: {
          select: { id: true, username: true, displayName: true },
        },
        soma: {
          select: { id: true, slug: true, name: true },
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

    if (posts.length === 0) {
      return [];
    }

    const postIds = posts.map((p) => p.id);

    const voteAggregates = await this.prisma.vote.groupBy({
      by: ['targetId'],
      where: {
        targetType: VoteTargetType.POST,
        targetId: { in: postIds },
      },
      _sum: {
        value: true,
      },
    });

    const awardAggregates = await this.prisma.award.groupBy({
      by: ['targetId'],
      where: {
        targetType: AwardTargetType.POST,
        targetId: { in: postIds },
      },
      _count: {
        _all: true,
      },
    });

    const voteMap = new Map<string, number>();
    voteAggregates.forEach((agg) => {
      voteMap.set(agg.targetId, agg._sum.value || 0);
    });

    const awardMap = new Map<string, number>();
    awardAggregates.forEach((agg) => {
      awardMap.set(agg.targetId, agg._count._all || 0);
    });

    return posts.map((post) => ({
      id: post.id,
      title: post.title,
      body: post.body,
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
      voteCount: voteMap.get(post.id) || 0,
      awardCount: awardMap.get(post.id) || 0,
    }));
  }
}
