import {
  Resolver,
  Query,
  Args,
  ResolveField,
  Parent,
  Int,
} from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { OptionalJwtAuthGuard } from '../../common/guards/optional-jwt-auth.guard';
import type { Express } from 'express';
import { VotesService } from '../votes/votes.service';
import { FeedService } from './feed.service';
import { FeedQueryDto } from './dto/feed-query.dto';
import { FeedConnectionQueryDto } from './dto/feed-connection-query.dto';
import { FeedItem } from './entities/feed-item.entity';
import { FeedConnection } from './entities/feed-connection.entity';
import { QueryCacheService } from '../../common/cache/query-cache.service';

@Resolver(() => FeedItem)
export class FeedResolver {
  constructor(
    private readonly feedService: FeedService,
    private readonly votesService: VotesService,
    private readonly queryCache: QueryCacheService,
  ) {}

  @Query(() => [FeedItem])
  @UseGuards(OptionalJwtAuthGuard)
  async getGlobalFeed(@Args() query: FeedQueryDto): Promise<FeedItem[]> {
    return this.queryCache.getOrSet(
      `query:feed:global:${query.limit ?? 20}:${query.cursor ?? 'first'}`,
      120_000,
      () => this.feedService.getGlobalFeed(query),
    );
  }

  @Query(() => [FeedItem])
  @UseGuards(OptionalJwtAuthGuard)
  async getSomaFeed(
    @Args('somaId') somaId: string,
    @Args() query: FeedQueryDto,
  ): Promise<FeedItem[]> {
    return this.queryCache.getOrSet(
      `query:feed:soma:${somaId}:${query.limit ?? 20}:${query.cursor ?? 'first'}`,
      120_000,
      () => this.feedService.getSomaFeed(somaId, query),
    );
  }

  @Query(() => FeedConnection)
  @UseGuards(OptionalJwtAuthGuard)
  globalFeedConnection(
    @Args() query: FeedConnectionQueryDto,
  ): Promise<FeedConnection> {
    return this.queryCache.getOrSet(
      `query:feed-connection:global:${query.first}:${query.after ?? 'first'}`,
      120_000,
      () => this.feedService.getGlobalFeedConnection(query),
    );
  }

  @Query(() => FeedConnection)
  @UseGuards(OptionalJwtAuthGuard)
  somaFeedConnection(
    @Args('somaId') somaId: string,
    @Args() query: FeedConnectionQueryDto,
  ): Promise<FeedConnection> {
    return this.queryCache.getOrSet(
      `query:feed-connection:soma:${somaId}:${query.first}:${query.after ?? 'first'}`,
      120_000,
      () => this.feedService.getSomaFeedConnection(somaId, query),
    );
  }

  @ResolveField(() => Int, { nullable: true })
  async userVoteValue(
    @Parent() feedItem: FeedItem,
    @CurrentUser() user: Express.User | null,
  ): Promise<number | null> {
    if (!user) return null;
    return this.votesService.getUserVoteValue(user.id, feedItem.id);
  }
}
