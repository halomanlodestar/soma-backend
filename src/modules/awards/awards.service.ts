import { AwardResult } from './types/award-result.type';
import { Inject, Injectable } from '@nestjs/common';
import { CreateAwardDto, AwardTargetType } from './dto/create-award.dto';
import { PrismaService } from '../../prisma/prisma.service';
import { Award } from './entities/award.entity';
import { ClientProxy } from '@nestjs/microservices';
import { lastValueFrom } from 'rxjs';
import { randomUUID } from 'crypto';
import type { CreateAwardEvent } from './types/award-events.type';
import { AsyncAccepted } from '../../common/entities/async-accepted.entity';
import { InvalidInputError } from '../../common/errors/graphql-errors';

@Injectable()
export class AwardsService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject('COMMANDS_RMQ_CLIENT') private readonly client: ClientProxy,
    @Inject('NOTIFICATIONS_RMQ_CLIENT')
    private readonly notificationsClient: ClientProxy,
  ) {}

  async create(
    userId: string,
    createAwardDto: CreateAwardDto,
  ): Promise<AwardResult> {
    const commandId = randomUUID();

    await lastValueFrom(
      this.client.emit('award.create', {
        commandId,
        userId,
        targetType: createAwardDto.targetType,
        targetId: createAwardDto.targetId,
        name: createAwardDto.name,
      } satisfies CreateAwardEvent),
    );

    return new AsyncAccepted(commandId);
  }

  async processCreate(event: CreateAwardEvent): Promise<void> {
    const recipientOrError = await this.validateTargetAndGetAuthor(
      event.targetType,
      event.targetId,
    );

    if (recipientOrError instanceof InvalidInputError) return;

    await this.prisma.award.upsert({
      where: { id: event.commandId },
      create: {
        id: event.commandId,
        awardedById: event.userId,
        postId:
          event.targetType === AwardTargetType.POST ? event.targetId : null,
        commentId:
          event.targetType === AwardTargetType.COMMENT ? event.targetId : null,
        name: event.name,
      },
      update: {},
    });

    if (recipientOrError !== event.userId) {
      await lastValueFrom(
        this.notificationsClient.emit('notification.create', {
          sourceEventId: `award:${event.commandId}`,
          userId: recipientOrError,
          type: 'AWARD',
          message: `You received a "${event.name}" award!`,
          postId:
            event.targetType === AwardTargetType.POST
              ? event.targetId
              : undefined,
          commentId:
            event.targetType === AwardTargetType.COMMENT
              ? event.targetId
              : undefined,
        }),
      );
    }
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
