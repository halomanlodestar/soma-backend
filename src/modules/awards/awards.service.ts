import { Injectable, BadRequestException } from '@nestjs/common';
import { CreateAwardDto } from './dto/create-award.dto';
import { PrismaService } from '../../prisma/prisma.service';
import { AwardTargetType } from '../../prisma/generated/client';
import { Award } from './entities/award.entity';

@Injectable()
export class AwardsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, createAwardDto: CreateAwardDto): Promise<Award> {
    const { targetType, targetId, name } = createAwardDto;

    await this.validateTarget(targetType, targetId);

    return this.prisma.award.create({
      data: {
        awardedById: userId,
        targetType,
        targetId,
        name,
      },
    });
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
