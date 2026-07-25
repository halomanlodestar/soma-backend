import {
  Resolver,
  Query,
  Mutation,
  Args,
  Int,
  createUnionType,
} from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { PostsService, PostResult } from './posts.service';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { Post as PostEntity } from './entities/post.entity';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { Express } from 'express';
import {
  NotFoundError,
  UnauthorizedError,
  InvalidInputError,
} from '../../common/errors/graphql-errors';

export const PostResultUnion = createUnionType({
  name: 'PostResult',
  types: () =>
    [PostEntity, NotFoundError, UnauthorizedError, InvalidInputError] as const,
  resolveType: (value) => {
    if (value instanceof NotFoundError) return NotFoundError;
    if (value instanceof UnauthorizedError) return UnauthorizedError;
    if (value instanceof InvalidInputError) return InvalidInputError;
    return PostEntity;
  },
});

@Resolver(() => PostEntity)
export class PostsResolver {
  constructor(private readonly postsService: PostsService) {}

  @Mutation(() => PostResultUnion)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('CREATOR', 'ADMIN')
  async createPost(
    @CurrentUser() user: Express.User,
    @Args('data') createPostDto: CreatePostDto,
  ): Promise<PostResult> {
    return this.postsService.create(user.id, createPostDto);
  }

  @Query(() => [PostEntity])
  async getTopPosts(
    @Args('page', { type: () => Int, nullable: true, defaultValue: 1 })
    page: number,
    @Args('limit', { type: () => Int, nullable: true, defaultValue: 20 })
    limit: number,
  ): Promise<PostEntity[]> {
    return this.postsService.findTopPosts(page, limit);
  }

  @Query(() => [PostEntity])
  async getPostsBySoma(@Args('somaId') somaId: string): Promise<PostEntity[]> {
    return this.postsService.findBySoma(somaId);
  }

  @Query(() => PostResultUnion)
  async getPostById(@Args('id') id: string): Promise<PostResult> {
    return this.postsService.findOne(id);
  }

  @Mutation(() => PostResultUnion)
  @UseGuards(JwtAuthGuard)
  async updatePost(
    @CurrentUser() user: Express.User,
    @Args('id') id: string,
    @Args('data') updatePostDto: UpdatePostDto,
  ): Promise<PostResult> {
    return this.postsService.update(user.id, user.role, id, updatePostDto);
  }

  @Mutation(() => PostResultUnion)
  @UseGuards(JwtAuthGuard)
  async deletePost(
    @CurrentUser() user: Express.User,
    @Args('id') id: string,
  ): Promise<PostResult> {
    return this.postsService.delete(user.id, user.role, id);
  }
}
