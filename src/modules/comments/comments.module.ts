import { Module } from '@nestjs/common';
import { CommentsService } from './comments.service';
import { CommentsResolver } from './comments.resolver';
import { PrismaService } from '../../prisma/prisma.service';
import { CommentsWorkerController } from './comments-worker.controller';

import { UsersModule } from '../users/users.module';
import { VotesModule } from '../votes/votes.module';

@Module({
  imports: [UsersModule, VotesModule],
  controllers: [CommentsWorkerController],
  providers: [CommentsService, CommentsResolver, PrismaService],
})
export class CommentsModule {}
