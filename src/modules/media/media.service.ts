import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { PrismaService } from '../../prisma/prisma.service';
import { MediaType, MediaUploadPurpose } from '../../prisma/generated/client';
import { MediaCollection } from './entities/media.entity';
import { StorageService } from './storage/storage.service';
import type { PresignedUploadResult } from './types/media.types';

@Injectable()
export class MediaService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storageService: StorageService,
  ) {}

  async createUploadIntent(input: {
    userId: string;
    purpose: MediaUploadPurpose;
    mediaType: MediaType;
    fileName: string;
    mimeType: string;
    byteSize: number;
  }): Promise<PresignedUploadResult & { assetId: string }> {
    const assetId = randomUUID();
    const upload = await this.storageService.generatePresignedUploadUrl(
      input.userId,
      assetId,
      input.fileName,
      input.mimeType,
    );

    await this.prisma.mediaAsset.create({
      data: {
        id: assetId,
        ownerId: input.userId,
        purpose: input.purpose,
        type: input.mediaType,
        stagingKey: upload.key,
        fileName: input.fileName,
        declaredMimeType: input.mimeType,
        declaredByteSize: input.byteSize,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      },
    });

    return { ...upload, assetId };
  }

  async getMediaByPost(postId: string): Promise<MediaCollection | null> {
    const result = await this.prisma.mediaCollection.findFirst({
      where: { postId, post: { visibility: 'PUBLISHED' } },
      include: {
        items: {
          orderBy: {
            createdAt: 'asc',
          },
        },
      },
    });

    return result as MediaCollection | null;
  }
}
