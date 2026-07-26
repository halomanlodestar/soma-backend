import { Module } from '@nestjs/common';
import { VotesModule } from '../votes/votes.module';
import { FeedService } from './feed.service';
import { FeedResolver } from './feed.resolver';
import { PrismaService } from '../../prisma/prisma.service';

@Module({
  imports: [VotesModule],
  providers: [FeedService, FeedResolver, PrismaService],
})
export class FeedModule {}
