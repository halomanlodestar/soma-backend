import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { PostsService } from './posts.service';
import { PostsController } from './posts.controller';
import { PrismaService } from '../../prisma/prisma.service';
import { StorageService } from '../media/storage/storage.service';
import { PostProcessingProcessor } from './processors/post-processing.processor';

@Module({
  imports: [BullModule.registerQueue({ name: 'post-processing' })],
  controllers: [PostsController],
  providers: [
    PostsService,
    PrismaService,
    StorageService,
    PostProcessingProcessor,
  ],
  exports: [PostsService],
})
export class PostsModule {}
