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
import { FeedItem } from './entities/feed-item.entity';

@Resolver(() => FeedItem)
export class FeedResolver {
  constructor(
    private readonly feedService: FeedService,
    private readonly votesService: VotesService,
  ) {}

  @Query(() => [FeedItem])
  @UseGuards(OptionalJwtAuthGuard)
  async getGlobalFeed(@Args() query: FeedQueryDto): Promise<FeedItem[]> {
    return this.feedService.getGlobalFeed(query);
  }

  @Query(() => [FeedItem])
  @UseGuards(OptionalJwtAuthGuard)
  async getSomaFeed(
    @Args('somaId') somaId: string,
    @Args() query: FeedQueryDto,
  ): Promise<FeedItem[]> {
    return this.feedService.getSomaFeed(somaId, query);
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
