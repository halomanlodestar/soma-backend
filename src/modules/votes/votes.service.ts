import { Injectable, BadRequestException } from '@nestjs/common';
import { CreateVoteDto } from './dto/create-vote.dto';
import { DeleteVoteDto } from './dto/delete-vote.dto';
import { PrismaService } from '../../prisma/prisma.service';
import { VoteTargetType } from '../../prisma/generated/client';
import { Vote } from './entities/vote.entity';

@Injectable()
export class VotesService {
  constructor(private readonly prisma: PrismaService) {}

  async upsert(userId: string, createVoteDto: CreateVoteDto): Promise<Vote> {
    const { targetType, targetId, value } = createVoteDto;

    // Validate target existence
    await this.validateTarget(targetType, targetId);

    // Upsert the vote
    return this.prisma.vote.upsert({
      where: {
        userId_targetType_targetId: {
          userId,
          targetType,
          targetId,
        },
      },
      update: {
        value,
      },
      create: {
        userId,
        targetType,
        targetId,
        value,
      },
    });
  }

  async remove(userId: string, deleteVoteDto: DeleteVoteDto): Promise<void> {
    const { targetType, targetId } = deleteVoteDto;

    try {
      await this.prisma.vote.delete({
        where: {
          userId_targetType_targetId: {
            userId,
            targetType,
            targetId,
          },
        },
      });
    } catch (e) {
      // If vote doesn't exist, we can treat it as success or ignore for idempotency
      // P2025 is "Record to delete does not exist."
      if (e.code !== 'P2025') {
        throw e;
      }
    }
  }

  private async validateTarget(
    targetType: VoteTargetType,
    targetId: string,
  ): Promise<void> {
    if (targetType === VoteTargetType.POST) {
      const post = await this.prisma.post.findUnique({
        where: { id: targetId },
      });
      if (!post) {
        throw new BadRequestException(`Post with id '${targetId}' not found`);
      }
    } else if (targetType === VoteTargetType.COMMENT) {
      const comment = await this.prisma.comment.findUnique({
        where: { id: targetId },
      });
      if (!comment) {
        throw new BadRequestException(
          `Comment with id '${targetId}' not found`,
        );
      }
    } else {
      throw new BadRequestException(`Invalid target type '${targetType}'`);
    }
  }
}
