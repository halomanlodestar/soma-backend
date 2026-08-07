import { CommentResultUnion } from './dto/comments-results.dto';
import {
  Resolver,
  Query,
  Mutation,
  Args,
  ResolveField,
  Parent,
  Int,
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
import { OptionalJwtAuthGuard } from '../../common/guards/optional-jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { Express } from 'express';
import { VotesService } from '../votes/votes.service';

@Resolver(() => CommentEntity)
export class CommentsResolver {
  constructor(
    private readonly commentsService: CommentsService,
    private readonly usersService: UsersService,
    private readonly votesService: VotesService,
  ) {}

  @ResolveField(() => UserResponseDto)
  async author(@Parent() comment: CommentEntity) {
    const result = await this.usersService.findById(comment.authorId);
    if ('message' in result) {
      throw new Error('Author not found');
    }
    return result;
  }

  @ResolveField(() => Int, { nullable: true })
  async userVoteValue(
    @Parent() comment: CommentEntity,
    @CurrentUser() user: Express.User | null,
  ): Promise<number | null> {
    if (!user) return null;
    return this.votesService.getUserVoteValue(user.id, comment.id);
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
  @UseGuards(OptionalJwtAuthGuard)
  async getCommentsByPost(
    @Args('postId') postId: string,
  ): Promise<CommentEntity[]> {
    return this.commentsService.findAllByPost(postId);
  }

  @Query(() => [CommentEntity])
  @UseGuards(OptionalJwtAuthGuard)
  getCommentsByUser(@Args('userId') userId: string): Promise<CommentEntity[]> {
    return this.commentsService.findAllByUser(userId);
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
      user.platformRole,
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
    return this.commentsService.remove(user.id, user.platformRole, id);
  }
}
