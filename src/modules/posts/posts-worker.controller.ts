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
        data: { visibility: 'PUBLIC' },
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
              originalUrl: this.storageService.buildPublicUrl(item.key),
            })),
          },
        },
      });

      await tx.post.update({
        where: { id: postId },
        data: { visibility: 'PUBLIC' },
      });
    });

    this.logger.log(`Post ${postId} processed and published.`);
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
          this.storageService.deleteObject(key).catch((err: unknown) => {
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
