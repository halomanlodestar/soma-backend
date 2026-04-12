import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { PrismaService } from '../../../prisma/prisma.service';
import { StorageService } from '../../media/storage/storage.service';
import { DeletePostJob } from '../jobs/delete.job';

@Processor('post-deletion')
export class PostDeletionProcessor extends WorkerHost {
  private readonly logger = new Logger(PostDeletionProcessor.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly storageService: StorageService,
  ) {
    super();
  }

  async process(job: Job<DeletePostJob>): Promise<void> {
    const { postId } = job.data;

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
