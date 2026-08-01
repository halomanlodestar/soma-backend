import { Module } from '@nestjs/common';
import { MediaService } from './media.service';
import { MediaResolver } from './media.resolver';
import { StorageService } from './storage/storage.service';
import { PrismaService } from '../../prisma/prisma.service';
import { ConfigModule } from '@nestjs/config';
import { SomaMembershipsModule } from '../soma-memberships/soma-memberships.module';

@Module({
  imports: [ConfigModule, SomaMembershipsModule],
  providers: [MediaService, MediaResolver, StorageService, PrismaService],
  exports: [MediaService, StorageService],
})
export class MediaModule {}
