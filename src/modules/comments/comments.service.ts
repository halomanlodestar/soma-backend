import { Injectable } from '@nestjs/common';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';
import { PrismaService } from '../../prisma/prisma.service';
import { Comment } from './entities/comment.entity';
import { NotificationsService } from '../notifications/notifications.service';
import {
  NotFoundError,
  UnauthorizedError,
  InvalidInputError,
  BaseError,
} from '../../common/errors/graphql-errors';

export type CommentResult =
  | Comment
  | NotFoundError
  | UnauthorizedError
  | InvalidInputError;

@Injectable()
export class CommentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService,
  ) {}

  async create(
    userId: string,
    postId: string,
    createCommentDto: CreateCommentDto,
  ): Promise<CommentResult> {
    const post = await this.prisma.post.findUnique({
      where: { id: postId },
    });

    if (!post) {
      return new InvalidInputError(`Post with id '${postId}' does not exist`);
    }

    const comment = await this.prisma.comment.create({
      data: {
        content: createCommentDto.content,
        authorId: userId,
        postId,
      },
    });

    if (post.authorId !== userId) {
      await this.notificationsService.create({
        userId: post.authorId,
        type: 'COMMENT',
        message: `Someone commented on your post: "${post.title}"`,
        postId: postId,
      });
    }

    return comment;
  }

  async reply(
    userId: string,
    parentCommentId: string,
    createCommentDto: CreateCommentDto,
  ): Promise<CommentResult> {
    const parent = await this.prisma.comment.findUnique({
      where: { id: parentCommentId },
    });

    if (!parent) {
      return new InvalidInputError(
        `Parent comment with id '${parentCommentId}' does not exist`,
      );
    }

    return this.prisma.comment.create({
      data: {
        content: createCommentDto.content,
        authorId: userId,
        postId: parent.postId,
        parentCommentId: parent.id,
      },
    });
  }

  async findAllByPost(postId: string): Promise<Comment[]> {
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
