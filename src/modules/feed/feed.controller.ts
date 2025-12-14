import { Controller, Get, Param, Query } from '@nestjs/common';
import { FeedService } from './feed.service';
import { FeedQueryDto } from './dto/feed-query.dto';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { FeedItem } from './entities/feed-item.entity';

@ApiTags('Feed')
@Controller()
export class FeedController {
  constructor(private readonly feedService: FeedService) {}

  @Get('feed')
  @ApiOperation({ summary: 'Get global feed (recent posts)' })
  @ApiResponse({
    status: 200,
    description: 'List of recent posts',
    type: [FeedItem],
  })
  getGlobalFeed(@Query() query: FeedQueryDto) {
    return this.feedService.getGlobalFeed(query);
  }

  @Get('somas/:somaId/feed')
  @ApiOperation({ summary: 'Get feed for a specific soma' })
  @ApiParam({ name: 'somaId', description: 'Soma UUID' })
  @ApiResponse({
    status: 200,
    description: 'List of recent posts in soma',
    type: [FeedItem],
  })
  getSomaFeed(@Param('somaId') somaId: string, @Query() query: FeedQueryDto) {
    return this.feedService.getSomaFeed(somaId, query);
  }
}
