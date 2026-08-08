import { Controller, Logger } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import { PrismaService } from '../../prisma/prisma.service';
import { StorageService } from '../media/storage/storage.service';

import { ProcessMediaEvent, DeletePostEvent } from './types/post-events.type';

@Controller()
export class PostsWorkerController {
  private readonly logger = new Logger(PostsWorkerController.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly storageService: StorageService,
  ) {}

  @EventPattern('post.process_media')
  async handleProcessMedia(@Payload() data: ProcessMediaEvent): Promise<void> {
    const { postId, assetIds } = data;

    if (!assetIds || assetIds.length === 0) {
      await this.prisma.post.update({
        where: { id: postId },
        data: { mediaStatus: 'READY' },
      });
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
        data: { mediaStatus: 'READY' },
      });
    });

    this.logger.log(`Media for post ${postId} processed and ready for review.`);
  }

  @EventPattern('post.publish')
  async handlePublishPost(@Payload() data: { postId: string }): Promise<void> {
    this.logger.log(`Publish event received for post ${data.postId}.`);

    const post = await this.prisma.post.findUnique({
      where: { id: data.postId },
      include: { media: { include: { items: true } } },
    });

    if (!post) {
      this.logger.warn(`Publish skipped: post ${data.postId} was not found.`);
      return;
    }

    if (post.visibility !== 'APPROVED' || post.mediaStatus !== 'READY') {
      this.logger.warn(
        `Publish skipped for post ${post.id}: visibility=${post.visibility}, mediaStatus=${post.mediaStatus}.`,
      );
      return;
    }

    for (const item of post.media?.items ?? []) {
      this.logger.log(
        `Promoting media item ${item.id} for post ${post.id}: ${item.s3Key}.`,
      );

      let publishedKey: string;
      try {
        publishedKey = await this.storageService.publishStagedObject(
          item.s3Key,
        );
      } catch (error) {
        this.logger.error(
          `Failed to promote media item ${item.id} for post ${post.id}: ${item.s3Key}.`,
          error instanceof Error ? error.stack : String(error),
        );
        throw error;
      }

      this.logger.log(
        `Promoted media item ${item.id} for post ${post.id}: ${publishedKey}.`,
      );

      await this.prisma.mediaItem.update({
        where: { id: item.id },
        data: {
          s3Key: publishedKey,
          originalUrl: this.storageService.buildPublicUrl(publishedKey),
        },
      });
      this.logger.log(
        `Updated media item ${item.id} with published key for post ${post.id}.`,
      );

      await this.storageService.deleteStagedObject(item.s3Key);
      this.logger.log(
        `Deleted staging object ${item.s3Key} for post ${post.id}.`,
      );
    }

    await this.prisma.post.update({
      where: { id: post.id },
      data: { visibility: 'PUBLISHED' },
    });
    this.logger.log(`Post ${post.id} published.`);
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
