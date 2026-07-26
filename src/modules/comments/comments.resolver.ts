import { CommentResultUnion } from './dto/comments-results.dto';
import {
  Resolver,
  Query,
  Mutation,
  Args,
  ResolveField,
  Parent,
} from '@nestjs/graphql';
import { UsersService } from '../users/users.service';
import { UserResponseDto } from '../users/dto/user-response.dto';
import { UseGuards } from '@nestjs/common';
import { CommentsService } from './comments.service';
import { CommentResult } from './types/comment-result.type';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';
import { Comment as CommentEntity } from './entities/comment.entity';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { Express } from 'express';

@Resolver(() => CommentEntity)
export class CommentsResolver {
  constructor(
    private readonly commentsService: CommentsService,
    private readonly usersService: UsersService,
  ) {}

  @ResolveField(() => UserResponseDto)
  async author(@Parent() comment: CommentEntity) {
    const result = await this.usersService.findById(comment.authorId);
    if ('message' in result) {
      throw new Error('Author not found');
    }
    return result;
  }

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
