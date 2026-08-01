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
    const { postId, media } = data;

    if (!media || media.length === 0) {
      await this.prisma.post.update({
        where: { id: postId },
        data: { mediaStatus: 'READY' },
      });
      return;
    }

    for (const item of media) {
      const exists = await this.storageService.verifyKeyExists(item.key);

      if (!exists) {
        throw new Error(
          `S3 key not found: ${item.key} (postId: ${postId}). Event will retry.`,
        );
      }
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.mediaCollection.create({
        data: {
          postId,
          items: {
            create: media.map((item) => ({
              type: item.type,
              s3Key: item.key,
              originalUrl: this.storageService.buildPublicUrl(
                this.storageService.getPublishedKey(item.key),
              ),
            })),
          },
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
    const post = await this.prisma.post.findUnique({
      where: { id: data.postId },
      include: { media: { include: { items: true } } },
    });
    if (!post || post.visibility !== 'APPROVED' || post.mediaStatus !== 'READY') return;

    for (const item of post.media?.items ?? []) {
      const publishedKey = await this.storageService.publishStagedObject(item.s3Key);
      await this.prisma.mediaItem.update({
        where: { id: item.id },
        data: { s3Key: publishedKey, originalUrl: this.storageService.buildPublicUrl(publishedKey) },
      });
      await this.storageService.deleteStagedObject(item.s3Key);
    }
    await this.prisma.post.update({
      where: { id: post.id },
      data: { visibility: 'PUBLISHED' },
    });
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
