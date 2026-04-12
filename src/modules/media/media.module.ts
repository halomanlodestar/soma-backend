import { Module } from '@nestjs/common';
import { MediaService } from './media.service';
import { MediaController } from './media.controller';
import { StorageService } from './storage/storage.service';
import { PrismaService } from '../../prisma/prisma.service';

@Module({
  controllers: [MediaController],
  providers: [MediaService, StorageService, PrismaService],
  exports: [MediaService, StorageService],
})
export class MediaModule {}
