import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { PostsService } from './posts.service';
import { PostsController } from './posts.controller';
import { PrismaService } from '../../prisma/prisma.service';
import { StorageService } from '../media/storage/storage.service';
import { PostProcessingProcessor } from './processors/post-processing.processor';
import { PostDeletionProcessor } from './processors/post-deletion.processor';

@Module({
  imports: [
    BullModule.registerQueue({ name: 'post-processing' }),
    BullModule.registerQueue({ name: 'post-deletion' }),
  ],
  controllers: [PostsController],
  providers: [
    PostsService,
    PrismaService,
    StorageService,
    PostProcessingProcessor,
    PostDeletionProcessor,
  ],
  exports: [PostsService],
})
export class PostsModule {}
