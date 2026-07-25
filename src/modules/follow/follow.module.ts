import { Module } from '@nestjs/common';
import { FollowService } from './follow.service';
import { FollowResolver } from './follow.resolver';
import { PrismaService } from '../../prisma/prisma.service';

@Module({
  providers: [FollowService, FollowResolver, PrismaService],
})
export class FollowModule {}
