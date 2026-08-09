import { Module } from '@nestjs/common';
import { MediaService } from './media.service';
import { MediaResolver } from './media.resolver';
import { StorageService } from './storage/storage.service';
import { PrismaService } from '../../prisma/prisma.service';
import { ConfigModule } from '@nestjs/config';
import { SomaMembershipsModule } from '../soma-memberships/soma-memberships.module';
import { MediaMetadataService } from './media-metadata.service';

@Module({
  imports: [ConfigModule, SomaMembershipsModule],
  providers: [
    MediaService,
    MediaResolver,
    StorageService,
    MediaMetadataService,
    PrismaService,
  ],
  exports: [MediaService, StorageService, MediaMetadataService],
})
export class MediaModule {}
