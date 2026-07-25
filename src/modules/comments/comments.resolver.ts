import {
  Resolver,
  Query,
  Mutation,
  Args,
  createUnionType,
} from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { CommentsService, CommentResult } from './comments.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';
import { Comment as CommentEntity } from './entities/comment.entity';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { Express } from 'express';
import {
  NotFoundError,
  UnauthorizedError,
  InvalidInputError,
} from '../../common/errors/graphql-errors';

export const CommentResultUnion = createUnionType({
  name: 'CommentResult',
  types: () =>
    [
      CommentEntity,
      NotFoundError,
      UnauthorizedError,
      InvalidInputError,
    ] as const,
  resolveType: (value) => {
    if (value instanceof NotFoundError) return NotFoundError;
    if (value instanceof UnauthorizedError) return UnauthorizedError;
    if (value instanceof InvalidInputError) return InvalidInputError;
    return CommentEntity;
  },
});

@Resolver(() => CommentEntity)
export class CommentsResolver {
  constructor(private readonly commentsService: CommentsService) {}

  @Mutation(() => CommentResultUnion)
  @UseGuards(JwtAuthGuard)
  async createComment(
    @CurrentUser() user: Express.User,
    @Args('postId') postId: string,
    @Args('data') createCommentDto: CreateCommentDto,
  ): Promise<CommentResult> {
    return this.commentsService.create(user.id, postId, createCommentDto);
  }

  @Mutation(() => CommentResultUnion)
  @UseGuards(JwtAuthGuard)
  async replyToComment(
    @CurrentUser() user: Express.User,
    @Args('commentId') commentId: string,
    @Args('data') createCommentDto: CreateCommentDto,
  ): Promise<CommentResult> {
    return this.commentsService.reply(user.id, commentId, createCommentDto);
  }

  @Query(() => [CommentEntity])
  async getCommentsByPost(
    @Args('postId') postId: string,
  ): Promise<CommentEntity[]> {
    return this.commentsService.findAllByPost(postId);
  }

  @Mutation(() => CommentResultUnion)
  @UseGuards(JwtAuthGuard)
  async updateComment(
    @CurrentUser() user: Express.User,
    @Args('id') id: string,
    @Args('data') updateCommentDto: UpdateCommentDto,
  ): Promise<CommentResult> {
    return this.commentsService.update(
      user.id,
      user.role,
      id,
      updateCommentDto,
    );
  }

  @Mutation(() => CommentResultUnion)
  @UseGuards(JwtAuthGuard)
  async deleteComment(
    @CurrentUser() user: Express.User,
    @Args('id') id: string,
  ): Promise<CommentResult> {
    return this.commentsService.remove(user.id, user.role, id);
  }
}
