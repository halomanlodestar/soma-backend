import { PostResultUnion } from './dto/posts-results.dto';
import {
  Resolver,
  Query,
  Mutation,
  Args,
  Int,
  ResolveField,
  Parent,
} from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { PostsService } from './posts.service';
import { UsersService } from '../users/users.service';
import { SomaService } from '../soma/soma.service';
import { PostResult } from './types/post-result.type';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { Post as PostEntity } from './entities/post.entity';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { OptionalJwtAuthGuard } from '../../common/guards/optional-jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { Express } from 'express';

import { UserResponseDto } from '../users/dto/user-response.dto';
import { Soma as SomaEntity } from '../soma/entities/soma.entity';
import { VotesService } from '../votes/votes.service';
import { PostVisibility } from './types/post-status.enums';
import { QueryCacheService } from '../../common/cache/query-cache.service';

@Resolver(() => PostEntity)
export class PostsResolver {
  constructor(
    private readonly postsService: PostsService,
    private readonly usersService: UsersService,
    private readonly somaService: SomaService,
    private readonly votesService: VotesService,
    private readonly queryCache: QueryCacheService,
  ) {}

  @ResolveField(() => UserResponseDto)
  async author(@Parent() post: PostEntity) {
    const result = await this.usersService.findById(post.authorId);

    if ('message' in result) {
      throw new Error('Author not found');
    }

    return result;
  }

  @ResolveField(() => SomaEntity)
  async soma(@Parent() post: PostEntity) {
    const result = await this.somaService.findById(post.somaId);

    if ('message' in result) {
      throw new Error('Soma not found');
    }

    return result;
  }

  @ResolveField(() => Int, { nullable: true })
  async userVoteValue(
    @Parent() post: PostEntity,
    @CurrentUser() user: Express.User | null,
  ): Promise<number | null> {
    if (!user) return null;

    return this.votesService.getUserVoteValue(user.id, post.id);
  }

  @Mutation(() => PostResultUnion)
  @UseGuards(JwtAuthGuard)
  async createPost(
    @CurrentUser() user: Express.User,
    @Args('data') createPostDto: CreatePostDto,
  ): Promise<PostResult> {
    return this.postsService.create(user.id, createPostDto);
  }

  @Query(() => [PostEntity])
  @UseGuards(OptionalJwtAuthGuard)
  async getTopPosts(
    @Args('page', { type: () => Int, nullable: true, defaultValue: 1 })
    page: number,
    @Args('limit', { type: () => Int, nullable: true, defaultValue: 20 })
    limit: number,
  ): Promise<PostEntity[]> {
    return this.queryCache.getOrSet(
      `query:posts:top:${page}:${limit}`,
      120_000,
      () => this.postsService.findTopPosts(page, limit),
    );
  }

  @Query(() => [PostEntity])
  @UseGuards(OptionalJwtAuthGuard)
  async getPostsBySoma(@Args('somaId') somaId: string): Promise<PostEntity[]> {
    return this.queryCache.getOrSet(`query:posts:soma:${somaId}`, 120_000, () =>
      this.postsService.findBySoma(somaId),
    );
  }

  @Query(() => [PostEntity])
  @UseGuards(OptionalJwtAuthGuard)
  async getPostsByUser(@Args('userId') userId: string): Promise<PostEntity[]> {
    return this.queryCache.getOrSet(`query:posts:user:${userId}`, 120_000, () =>
      this.postsService.findByUser(userId),
    );
  }

  @Query(() => PostResultUnion)
  @UseGuards(OptionalJwtAuthGuard)
  async getPostById(@Args('id') id: string): Promise<PostResult> {
    return this.queryCache.getOrSet(`query:post:${id}`, 120_000, () =>
      this.postsService.findOne(id),
    );
  }

  @Mutation(() => PostResultUnion)
  @UseGuards(JwtAuthGuard)
  async updatePost(
    @CurrentUser() user: Express.User,
    @Args('id') id: string,
    @Args('data') updatePostDto: UpdatePostDto,
  ): Promise<PostResult> {
    return this.postsService.update(
      user.id,
      user.platformRole,
      id,
      updatePostDto,
    );
  }

  @Query(() => [PostEntity])
  @UseGuards(JwtAuthGuard)
  myStudioPosts(
    @CurrentUser() user: Express.User,
    @Args('statuses', { type: () => [PostVisibility], nullable: true })
    statuses?: PostVisibility[],
  ): Promise<PostEntity[]> {
    return this.postsService.findStudioPosts(user.id, statuses);
  }

  @Query(() => PostResultUnion)
  @UseGuards(JwtAuthGuard)
  myStudioPost(
    @CurrentUser() user: Express.User,
    @Args('id') id: string,
  ): Promise<PostResult> {
    return this.postsService.findStudioPost(user.id, id);
  }

  @Mutation(() => PostResultUnion)
  @UseGuards(JwtAuthGuard)
  async deletePost(
    @CurrentUser() user: Express.User,
    @Args('id') id: string,
  ): Promise<PostResult> {
    return this.postsService.delete(user.id, user.platformRole, id);
  }
}
