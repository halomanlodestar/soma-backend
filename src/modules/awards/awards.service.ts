import { AwardResult } from './types/award-result.type';
import { Injectable } from '@nestjs/common';
import { CreateAwardDto, AwardTargetType } from './dto/create-award.dto';
import { PrismaService } from '../../prisma/prisma.service';
import { Award } from './entities/award.entity';
import { NotificationsService } from '../notifications/notifications.service';
import { InvalidInputError } from '../../common/errors/graphql-errors';

@Injectable()
export class AwardsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService,
  ) {}

  async create(
    userId: string,
    createAwardDto: CreateAwardDto,
  ): Promise<AwardResult> {
    const { targetType, targetId, name } = createAwardDto;

    const recipientOrError = await this.validateTargetAndGetAuthor(
      targetType,
      targetId,
    );

    if (recipientOrError instanceof InvalidInputError) {
      return recipientOrError;
    }

    const recipientId = recipientOrError;

    const award = await this.prisma.award.create({
      data: {
        awardedById: userId,
        postId: targetType === AwardTargetType.POST ? targetId : null,
        commentId: targetType === AwardTargetType.COMMENT ? targetId : null,
        name,
      },
    });

    if (recipientId !== userId) {
      await this.notificationsService.create({
        userId: recipientId,
        type: 'AWARD',
        message: `You received a "${name}" award!`,
        postId: targetType === AwardTargetType.POST ? targetId : undefined,
        commentId:
          targetType === AwardTargetType.COMMENT ? targetId : undefined,
      });
    }

    return award;
  }

  private async validateTargetAndGetAuthor(
    targetType: AwardTargetType,
    targetId: string,
  ): Promise<string | InvalidInputError> {
    if (targetType === AwardTargetType.POST) {
      const post = await this.prisma.post.findUnique({
        where: { id: targetId },
        select: { authorId: true },
      });
      if (!post) {
        return new InvalidInputError(`Post with id '${targetId}' not found`);
      }
      return post.authorId;
    } else if (targetType === AwardTargetType.COMMENT) {
      const comment = await this.prisma.comment.findUnique({
        where: { id: targetId },
        select: { authorId: true },
      });
      if (!comment) {
        return new InvalidInputError(`Comment with id '${targetId}' not found`);
      }
      return comment.authorId;
    } else {
      return new InvalidInputError(
        `Invalid target type '${targetType as string}'`,
      );
    }
  }

  async findAllByPost(postId: string): Promise<Award[]> {
    return this.prisma.award.findMany({
      where: {
        postId,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findAllByComment(commentId: string): Promise<Award[]> {
    return this.prisma.award.findMany({
      where: {
        commentId,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }
}
