import { Module } from '@nestjs/common';
import { MediaService } from './media.service';
import { MediaController } from './media.controller';
import { StorageService } from './storage/storage.service';
import { PrismaService } from '../../prisma/prisma.service';
import { PostsService } from '../posts/posts.service';

@Module({
  controllers: [MediaController],
  providers: [MediaService, StorageService, PrismaService, PostsService],
  exports: [MediaService, StorageService],
})
export class MediaModule {}
