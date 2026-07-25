import { Resolver, Query, Args } from '@nestjs/graphql';
import { FeedService } from './feed.service';
import { FeedQueryDto } from './dto/feed-query.dto';
import { FeedItem } from './entities/feed-item.entity';

@Resolver(() => FeedItem)
export class FeedResolver {
  constructor(private readonly feedService: FeedService) {}

  @Query(() => [FeedItem])
  async getGlobalFeed(@Args() query: FeedQueryDto): Promise<FeedItem[]> {
    return this.feedService.getGlobalFeed(query);
  }

  @Query(() => [FeedItem])
  async getSomaFeed(
    @Args('somaId') somaId: string,
    @Args() query: FeedQueryDto,
  ): Promise<FeedItem[]> {
    return this.feedService.getSomaFeed(somaId, query);
  }
}
