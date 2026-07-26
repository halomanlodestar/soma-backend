import { Controller, Logger } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import { PrismaService } from '../../prisma/prisma.service';
import { TargetType } from './dto/create-vote.dto';
import type { VoteEvent } from './types/vote-events.type';

@Controller()
export class VotesWorkerController {
  private readonly logger = new Logger(VotesWorkerController.name);

  constructor(private readonly prisma: PrismaService) {}

  @EventPattern('vote.cast')
  async handleVoteCast(@Payload() data: VoteEvent): Promise<void> {
    const { userId, targetType, targetId, value } = data;

    try {
      if (targetType === TargetType.POST) {
        await this.prisma.vote.upsert({
          where: { userId_postId: { userId, postId: targetId } },
          update: { value: value! },
          create: { userId, postId: targetId, value: value! },
        });
      } else {
        await this.prisma.vote.upsert({
          where: { userId_commentId: { userId, commentId: targetId } },
          update: { value: value! },
          create: { userId, commentId: targetId, value: value! },
        });
      }

      await this.updateAggregates(targetType, targetId);
      this.logger.log(`Vote processed for ${targetType} ${targetId}`);
    } catch (err) {
      this.logger.error(`Failed to process vote for ${targetId}`, err);
    }
  }

  @EventPattern('vote.removed')
  async handleVoteRemoved(@Payload() data: VoteEvent): Promise<void> {
    const { userId, targetType, targetId } = data;

    try {
      if (targetType === TargetType.POST) {
        await this.prisma.vote.deleteMany({
          where: { userId, postId: targetId },
        });
      } else {
        await this.prisma.vote.deleteMany({
          where: { userId, commentId: targetId },
        });
      }

      await this.updateAggregates(targetType, targetId);
      this.logger.log(`Vote removed for ${targetType} ${targetId}`);
    } catch (err) {
      this.logger.error(`Failed to remove vote for ${targetId}`, err);
    }
  }

  private async updateAggregates(targetType: TargetType, targetId: string) {
    if (targetType === TargetType.POST) {
      const aggregates = await this.prisma.vote.aggregate({
        where: { postId: targetId },
        _sum: { value: true },
      });

      const voteCount = aggregates._sum.value || 0;

      const post = await this.prisma.post.findUnique({
        where: { id: targetId },
      });
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

    // Unix timestamp in seconds
    const seconds = createdAt.getTime() / 1000 - 1577836800; // Epoch starting Jan 1, 2020

    // Reddit-style decay: score dominates for a short time, then age dominates.
    return Math.round((sign * order + seconds / 45000) * 10000000) / 10000000;
  }
}
