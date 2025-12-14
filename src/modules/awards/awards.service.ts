import { Injectable, BadRequestException } from '@nestjs/common';
import { CreateAwardDto } from './dto/create-award.dto';
import { PrismaService } from '../../prisma/prisma.service';
import { AwardTargetType } from '../../prisma/generated/client';
import { Award } from './entities/award.entity';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class AwardsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService,
  ) {}

  async create(userId: string, createAwardDto: CreateAwardDto): Promise<Award> {
    const { targetType, targetId, name } = createAwardDto;

    const recipientId = await this.validateTargetAndGetAuthor(
      targetType,
      targetId,
    );

    const award = await this.prisma.award.create({
      data: {
        awardedById: userId,
        targetType,
        targetId,
        name,
      },
    });

    // Notify recipient
    if (recipientId !== userId) {
      await this.notificationsService.create({
        userId: recipientId,
        type: 'AWARD',
        message: `You received a "${name}" award!`,
        targetType: targetType.toString(), // Convert enum to string
        targetId: targetId,
      });
    }

    return award;
  }

  // Renamed from validateTarget to better reflect purpose
  private async validateTargetAndGetAuthor(
    targetType: AwardTargetType,
    targetId: string,
  ): Promise<string> {
    if (targetType === AwardTargetType.POST) {
      const post = await this.prisma.post.findUnique({
        where: { id: targetId },
        select: { authorId: true },
      });
      if (!post) {
        throw new BadRequestException(`Post with id '${targetId}' not found`);
      }
      return post.authorId;
    } else if (targetType === AwardTargetType.COMMENT) {
      const comment = await this.prisma.comment.findUnique({
        where: { id: targetId },
        select: { authorId: true },
      });
      if (!comment) {
        throw new BadRequestException(
          `Comment with id '${targetId}' not found`,
        );
      }
      return comment.authorId;
    } else {
      throw new BadRequestException(`Invalid target type '${targetType}'`);
    }
  }

  async findAllByPost(postId: string): Promise<Award[]> {
    return this.prisma.award.findMany({
      where: {
        targetType: AwardTargetType.POST,
        targetId: postId,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findAllByComment(commentId: string): Promise<Award[]> {
    return this.prisma.award.findMany({
      where: {
        targetType: AwardTargetType.COMMENT,
        targetId: commentId,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  private async validateTarget(
    targetType: AwardTargetType,
    targetId: string,
  ): Promise<void> {
    if (targetType === AwardTargetType.POST) {
      const post = await this.prisma.post.findUnique({
        where: { id: targetId },
      });
      if (!post) {
        throw new BadRequestException(`Post with id '${targetId}' not found`);
      }
    } else if (targetType === AwardTargetType.COMMENT) {
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
