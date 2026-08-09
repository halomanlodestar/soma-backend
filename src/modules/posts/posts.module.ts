import { Module } from '@nestjs/common';
import { PostsService } from './posts.service';
import { PostsResolver } from './posts.resolver';
import { PrismaService } from '../../prisma/prisma.service';
import { MediaModule } from '../media/media.module';
import { PostsWorkerController } from './posts-worker.controller';
import { UsersModule } from '../users/users.module';
import { SomaModule } from '../soma/soma.module';
import { VotesModule } from '../votes/votes.module';
import { SomaMembershipsModule } from '../soma-memberships/soma-memberships.module';

@Module({
  imports: [
    UsersModule,
    SomaModule,
    VotesModule,
    SomaMembershipsModule,
    MediaModule,
  ],
  controllers: [PostsWorkerController],
  providers: [PostsService, PostsResolver, PrismaService],
  exports: [PostsService],
})
export class PostsModule {}
