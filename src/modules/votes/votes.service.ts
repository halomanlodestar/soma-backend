import { Injectable } from '@nestjs/common';
import { CreateVoteDto } from './dto/create-vote.dto';
import { DeleteVoteDto } from './dto/delete-vote.dto';
import { PrismaService } from '../../prisma/prisma.service';
import { VoteTargetType } from '../../prisma/generated/client';
import { Vote } from './entities/vote.entity';
import { Prisma } from 'src/prisma/generated/client';
import { InvalidInputError } from '../../common/errors/graphql-errors';

export type VoteResult = Vote | InvalidInputError;

@Injectable()
export class VotesService {
  constructor(private readonly prisma: PrismaService) {}

  async upsert(
    userId: string,
    createVoteDto: CreateVoteDto,
  ): Promise<VoteResult> {
    const { targetType, targetId, value } = createVoteDto;

    const validationError = await this.validateTarget(targetType, targetId);
    if (validationError) {
      return validationError;
    }

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

  async remove(userId: string, deleteVoteDto: DeleteVoteDto): Promise<boolean> {
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
      return true;
    } catch (error: unknown) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2025'
      ) {
        return true;
      }
      throw error;
    }
  }

  private async validateTarget(
    targetType: VoteTargetType,
    targetId: string,
  ): Promise<InvalidInputError | null> {
    switch (targetType) {
      case VoteTargetType.POST: {
        const post = await this.prisma.post.findUnique({
          where: { id: targetId },
        });

        if (!post) {
          return new InvalidInputError(`Post with id '${targetId}' not found`);
        }

        break;
      }
      case VoteTargetType.COMMENT: {
        const comment = await this.prisma.comment.findUnique({
          where: { id: targetId },
        });
        if (!comment) {
          return new InvalidInputError(
            `Comment with id '${targetId}' not found`,
          );
        }
        break;
      }
      default:
        return new InvalidInputError(
          `Invalid target type '${targetType as string}'`,
        );
    }
    return null;
  }
}
