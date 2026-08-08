import { Inject, Injectable } from '@nestjs/common';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';
import { PrismaService } from '../../prisma/prisma.service';
import { Comment } from './entities/comment.entity';
import { ClientProxy } from '@nestjs/microservices';
import { lastValueFrom } from 'rxjs';
import { randomUUID } from 'crypto';
import type { CreateCommentEvent } from './types/comment-events.type';
import {
  NotFoundError,
  UnauthorizedError,
  BaseError,
} from '../../common/errors/graphql-errors';
import { CommentResult } from './types/comment-result.type';
import { AsyncAccepted } from '../../common/entities/async-accepted.entity';

@Injectable()
export class CommentsService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject('COMMANDS_RMQ_CLIENT') private readonly client: ClientProxy,
    @Inject('NOTIFICATIONS_RMQ_CLIENT')
    private readonly notificationsClient: ClientProxy,
  ) {}

  async create(
    userId: string,
    postId: string,
    createCommentDto: CreateCommentDto,
  ): Promise<CommentResult> {
    const commandId = randomUUID();
    await lastValueFrom(
      this.client.emit('comment.create', {
        commandId,
        userId,
        postId,
        content: createCommentDto.content,
      } satisfies CreateCommentEvent),
    );

    return new AsyncAccepted(commandId);
  }

  async reply(
    userId: string,
    parentCommentId: string,
    createCommentDto: CreateCommentDto,
  ): Promise<CommentResult> {
    const commandId = randomUUID();
    await lastValueFrom(
      this.client.emit('comment.create', {
        commandId,
        userId,
        postId: undefined,
        content: createCommentDto.content,
        parentCommentId,
      } satisfies CreateCommentEvent),
    );

    return new AsyncAccepted(commandId);
  }

  async processCreate(event: CreateCommentEvent): Promise<void> {
    const parent = event.parentCommentId
      ? await this.prisma.comment.findUnique({
          where: { id: event.parentCommentId },
          select: { id: true, postId: true },
        })
      : null;
    const postId = parent?.postId ?? event.postId;
    if (!postId) return;
    const post = await this.prisma.post.findFirst({
      where: { id: postId, visibility: 'PUBLISHED' },
      select: { authorId: true, title: true },
    });

    if (!post || (event.parentCommentId && !parent)) {
      return;
    }

    await this.prisma.comment.upsert({
      where: { id: event.commandId },
      create: {
        id: event.commandId,
        content: event.content,
        authorId: event.userId,
        postId,
        parentCommentId: parent?.id,
      },
      update: {},
    });

    if (post.authorId !== event.userId) {
      await lastValueFrom(
        this.notificationsClient.emit('notification.create', {
          sourceEventId: `comment:${event.commandId}`,
          recipientId: post.authorId,
          actorId: event.userId,
          eventType: 'comment.created.v1',
          eventData: {
            resource: { type: 'comment', id: event.commandId },
            context: { postId },
            template: {
              key: 'notification.comment.created',
              variables: { postTitle: post.title },
            },
          },
        }),
      );
    }
  }

  async findAllByPost(postId: string): Promise<Comment[]> {
    const post = await this.prisma.post.findFirst({
      where: { id: postId, visibility: 'PUBLISHED' },
      select: { id: true },
    });
    if (!post) return [];

    return this.prisma.comment.findMany({
      where: { postId },
      orderBy: {
        createdAt: 'asc',
      },
    });
  }

  async findAllByUser(userId: string): Promise<Comment[]> {
    return this.prisma.comment.findMany({
      where: { authorId: userId },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findOne(id: string): Promise<CommentResult> {
    const comment = await this.prisma.comment.findUnique({
      where: { id },
    });

    if (!comment) {
      return new NotFoundError(`Comment with id '${id}' not found`);
    }

    return comment;
  }

  async update(
    userId: string,
    userRole: string,
    commentId: string,
    updateCommentDto: UpdateCommentDto,
  ): Promise<CommentResult> {
    const commentResult = await this.findOne(commentId);

    if (commentResult instanceof BaseError) {
      return commentResult;
    }

    if (!('authorId' in commentResult)) {
      return commentResult;
    }

    if (commentResult.authorId !== userId && userRole !== 'ADMIN') {
      return new UnauthorizedError(
        'You can only update your own comments unless you are an admin',
      );
    }

    return this.prisma.comment.update({
      where: { id: commentId },
      data: updateCommentDto,
    });
  }

  async remove(
    userId: string,
    userRole: string,
    commentId: string,
  ): Promise<CommentResult> {
    const commentResult = await this.findOne(commentId);

    if (commentResult instanceof BaseError) {
      return commentResult;
    }

    if (!('authorId' in commentResult)) {
      return commentResult;
    }

    if (commentResult.authorId !== userId && userRole !== 'ADMIN') {
      return new UnauthorizedError(
        'You can only delete your own comments unless you are an admin',
      );
    }

    return this.prisma.comment.delete({
      where: { id: commentId },
    });
  }
}
