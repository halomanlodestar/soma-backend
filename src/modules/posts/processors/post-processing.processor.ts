import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { PrismaService } from '../../../prisma/prisma.service';
import { StorageService } from '../../media/storage/storage.service';
import { CreatePostJob } from '../jobs/create.job';

@Processor('post-processing')
export class PostProcessingProcessor extends WorkerHost {
  private readonly logger = new Logger(PostProcessingProcessor.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly storageService: StorageService,
  ) {
    super();
  }

  async process(job: Job<CreatePostJob>): Promise<void> {
    const { postId, media } = job.data;

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
          `S3 key not found: ${item.key} (postId: ${postId}). Job will retry.`,
        );
      }
    }

    await this.prisma.$transaction(async (tx) => {
      const collection = await tx.mediaCollection.create({
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

      return collection;
    });

    this.logger.log(`Post ${postId} processed and published.`);
  }
}
