import { Controller, Inject, Logger } from '@nestjs/common';
import { ClientProxy, EventPattern, Payload } from '@nestjs/microservices';
import { PrismaService } from '../../prisma/prisma.service';
import { QueryCacheService } from '../../common/cache/query-cache.service';
import { StorageService } from '../media/storage/storage.service';

import { ProcessMediaEvent, DeletePostEvent } from './types/post-events.type';

@Controller()
export class PostsWorkerController {
  private readonly logger = new Logger(PostsWorkerController.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly storageService: StorageService,
    @Inject('RMQ_CLIENT') private readonly client: ClientProxy,
    private readonly queryCache: QueryCacheService,
  ) {}

  @EventPattern('post.process_media')
  async handleProcessMedia(@Payload() data: ProcessMediaEvent): Promise<void> {
    const { postId, assetIds } = data;

    if (!assetIds || assetIds.length === 0) {
      const result = await this.prisma.post.updateMany({
        where: { id: postId, visibility: 'DRAFT' },
        data: { mediaStatus: 'READY', visibility: 'APPROVED' },
      });

      if (result.count) this.client.emit('post.publish', { postId });

      return;
    }

    const post = await this.prisma.post.findUnique({
      where: { id: postId },
      select: { authorId: true },
    });

    if (!post) return;

    const assets = await this.prisma.mediaAsset.findMany({
      where: {
        id: { in: assetIds },
        ownerId: post.authorId,
        purpose: 'POST_MEDIA',
        status: 'UPLOAD_PENDING',
      },
    });

    if (assets.length !== assetIds.length) {
      throw new Error(`Invalid media assets for post ${postId}.`);
    }

    for (const asset of assets) {
      const exists = await this.storageService.verifyKeyExists(
        asset.stagingKey,
      );

      if (!exists) {
        throw new Error(
          `S3 key not found: ${asset.stagingKey} (postId: ${postId}). Event will retry.`,
        );
      }
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.mediaCollection.create({
        data: {
          postId,
          items: {
            create: assets.map((asset) => ({
              type: asset.type,
              s3Key: asset.stagingKey,
              originalUrl: this.storageService.buildPublicUrl(
                this.storageService.getPublishedKey(asset.stagingKey),
              ),
            })),
          },
        },
      });

      await tx.postMediaAttachment.createMany({
        data: assetIds.map((assetId, position) => ({
          postId,
          assetId,
          position,
        })),
      });

      await tx.mediaAsset.updateMany({
        where: { id: { in: assetIds } },
        data: {
          status: 'READY',
          uploadedAt: new Date(),
          processedAt: new Date(),
        },
      });

      await tx.post.update({
        where: { id: postId },
        data: { mediaStatus: 'READY', visibility: 'APPROVED' },
      });
    });

    this.client.emit('post.publish', { postId });
    this.logger.log(`Media for post ${postId} processed and ready for review.`);
  }

  @EventPattern('post.publish')
  async handlePublishPost(@Payload() data: { postId: string }): Promise<void> {
    const post = await this.prisma.post.findUnique({
      where: { id: data.postId },
      include: { media: { include: { items: true } } },
    });

    if (
      !post ||
      post.visibility !== 'APPROVED' ||
      post.mediaStatus !== 'READY'
    ) {
      this.logger.log(
        `Mismatch: visibility=${post?.visibility}, mediaStatus=${post?.mediaStatus}`,
      );
      return;
    }

    for (const item of post.media?.items ?? []) {
      const publishedKey = await this.storageService.publishStagedObject(
        item.s3Key,
      );

      await this.prisma.mediaItem.update({
        where: { id: item.id },
        data: {
          s3Key: publishedKey,
          originalUrl: this.storageService.buildPublicUrl(publishedKey),
        },
      });

      await this.storageService.deleteStagedObject(item.s3Key);
    }

    await this.prisma.post.update({
      where: { id: post.id },
      data: { visibility: 'PUBLISHED' },
    });

    await this.queryCache.invalidate(`query:post:${post.id}`);
  }

  @EventPattern('post.delete')
  async handleDeletePost(@Payload() data: DeletePostEvent): Promise<void> {
    const { postId } = data;

    const post = await this.prisma.post.findUnique({
      where: { id: postId },
      include: {
        media: {
          include: {
            items: {
              select: { s3Key: true },
            },
          },
        },
      },
    });

    if (!post) {
      this.logger.log(`Post ${postId} already deleted — skipping.`);
      return;
    }

    const s3Keys = post.media?.items.map((i) => i.s3Key) ?? [];

    if (s3Keys.length > 0) {
      await Promise.all(
        s3Keys.map((key) =>
          (key.startsWith('published/')
            ? this.storageService.deletePublishedObject(key)
            : this.storageService.deleteStagedObject(key)
          ).catch((err: unknown) => {
            this.logger.error(
              `Failed to delete S3 object ${key} for post ${postId}`,
              err,
            );
          }),
        ),
      );
    }

    await this.prisma.post.delete({ where: { id: postId } });

    this.logger.log(`Post ${postId} and its media deleted successfully.`);
  }
}
