import { Module } from '@nestjs/common';
import { FeedService } from './feed.service';
import { FeedResolver } from './feed.resolver';
import { PrismaService } from '../../prisma/prisma.service';

@Module({
  providers: [FeedService, FeedResolver, PrismaService],
})
export class FeedModule {}
