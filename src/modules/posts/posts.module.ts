import { Module } from '@nestjs/common';
import { PostsService } from './posts.service';
import { PostsResolver } from './posts.resolver';
import { PrismaService } from '../../prisma/prisma.service';
import { StorageService } from '../media/storage/storage.service';
import { PostsWorkerController } from './posts-worker.controller';
import { UsersModule } from '../users/users.module';
import { SomaModule } from '../soma/soma.module';

@Module({
  imports: [UsersModule, SomaModule],
  controllers: [PostsWorkerController],
  providers: [PostsService, PostsResolver, PrismaService, StorageService],
  exports: [PostsService],
})
export class PostsModule {}
