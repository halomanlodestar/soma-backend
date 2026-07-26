import { Controller, Logger } from '@nestjs/common';
import { EventPattern, Payload, Ctx, RmqContext } from '@nestjs/microservices';
import { PrismaService } from '../../prisma/prisma.service';
import { TargetType } from './dto/create-vote.dto';
import type { VoteEvent } from './types/vote-events.type';

interface BatchItem {
  event: VoteEvent;
  type: 'cast' | 'remove';
  context: RmqContext;
}

@Controller()
export class VotesWorkerController {
  private readonly logger = new Logger(VotesWorkerController.name);
  private batch: BatchItem[] = [];
  private flushTimeout: NodeJS.Timeout | null = null;
  private readonly BATCH_SIZE = 500;
  private readonly FLUSH_INTERVAL_MS = 5000;

  constructor(private readonly prisma: PrismaService) {}

  @EventPattern('vote.cast')
  async handleVoteCast(@Payload() data: VoteEvent, @Ctx() context: RmqContext): Promise<void> {
    this.addToBatch({ event: data, type: 'cast', context });
  }

  @EventPattern('vote.removed')
  async handleVoteRemoved(@Payload() data: VoteEvent, @Ctx() context: RmqContext): Promise<void> {
    this.addToBatch({ event: data, type: 'remove', context });
  }

  private addToBatch(item: BatchItem) {
    this.batch.push(item);
    
    if (this.batch.length >= this.BATCH_SIZE) {
      if (this.flushTimeout) {
        clearTimeout(this.flushTimeout);
        this.flushTimeout = null;
      }
      this.flush().catch(err => this.logger.error('Batch flush failed', err));
    } else if (!this.flushTimeout) {
      this.flushTimeout = setTimeout(() => {
        this.flushTimeout = null;
        this.flush().catch(err => this.logger.error('Batch flush failed', err));
      }, this.FLUSH_INTERVAL_MS);
    }
  }

  private async flush() {
    if (this.batch.length === 0) return;
    const itemsToProcess = [...this.batch];
    this.batch = [];

    const latestVotes = new Map<string, BatchItem>();
    
    // De-duplicate votes for the same user and target
    for (const item of itemsToProcess) {
      const key = `${item.event.userId}:${item.event.targetType}:${item.event.targetId}`;
      latestVotes.set(key, item);
    }

    try {
      const operations: any[] = [];
      const aggregatesToUpdate = new Set<string>();

      for (const item of latestVotes.values()) {
        const { event, type } = item;
        aggregatesToUpdate.add(`${event.targetType}:${event.targetId}`);

        if (type === 'cast') {
          if (event.targetType === TargetType.POST) {
            operations.push(this.prisma.vote.upsert({
              where: { userId_postId: { userId: event.userId, postId: event.targetId } },
              update: { value: event.value! },
              create: { userId: event.userId, postId: event.targetId, value: event.value! },
            }));
          } else {
            operations.push(this.prisma.vote.upsert({
              where: { userId_commentId: { userId: event.userId, commentId: event.targetId } },
              update: { value: event.value! },
              create: { userId: event.userId, commentId: event.targetId, value: event.value! },
            }));
          }
        } else {
          if (event.targetType === TargetType.POST) {
            operations.push(this.prisma.vote.deleteMany({
              where: { userId: event.userId, postId: event.targetId },
            }));
          } else {
            operations.push(this.prisma.vote.deleteMany({
              where: { userId: event.userId, commentId: event.targetId },
            }));
          }
        }
      }

      await this.prisma.$transaction(operations);

      for (const aggregate of aggregatesToUpdate) {
        const [targetType, targetId] = aggregate.split(':');
        await this.updateAggregates(targetType as TargetType, targetId);
      }

      for (const item of itemsToProcess) {
        const channel = item.context.getChannelRef();
        const originalMsg = item.context.getMessage();
        channel.ack(originalMsg);
      }

      this.logger.log(`Successfully flushed batch of ${itemsToProcess.length} events.`);
    } catch (error: any) {
      this.logger.error(`Error flushing batch: ${error.message}`, error.stack);
      // Nack messages to retry
      for (const item of itemsToProcess) {
        const channel = item.context.getChannelRef();
        const originalMsg = item.context.getMessage();
        channel.nack(originalMsg);
      }
    }
  }

  private async updateAggregates(targetType: TargetType, targetId: string) {
    if (targetType === TargetType.POST) {
      const aggregates = await this.prisma.vote.aggregate({
        where: { postId: targetId },
        _sum: { value: true },
      });
      const voteCount = aggregates._sum.value || 0;
      const post = await this.prisma.post.findUnique({ where: { id: targetId } });
      if (post) {
        const hotScore = this.calculateHotScore(voteCount, post.createdAt);
        await this.prisma.post.update({
          where: { id: targetId },
          data: { voteCount, hotScore },
        });
      }
    } else if (targetType === TargetType.COMMENT) {
      const aggregates = await this.prisma.vote.aggregate({
        where: { commentId: targetId },
        _sum: { value: true },
      });
      const voteCount = aggregates._sum.value || 0;
      await this.prisma.comment.updateMany({
        where: { id: targetId },
        data: { voteCount },
      });
    }
  }

  private calculateHotScore(voteCount: number, createdAt: Date): number {
    const order = Math.log10(Math.max(Math.abs(voteCount), 1));
    const sign = voteCount > 0 ? 1 : voteCount < 0 ? -1 : 0;
    const seconds = createdAt.getTime() / 1000 - 1577836800; 
    return Math.round((sign * order + seconds / 45000) * 10000000) / 10000000;
  }
}
