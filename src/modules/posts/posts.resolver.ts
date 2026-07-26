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
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { Express } from 'express';

import { UserResponseDto } from '../users/dto/user-response.dto';
import { Soma as SomaEntity } from '../soma/entities/soma.entity';
import { VotesService } from '../votes/votes.service';

@Resolver(() => PostEntity)
export class PostsResolver {
  constructor(
    private readonly postsService: PostsService,
    private readonly usersService: UsersService,
    private readonly somaService: SomaService,
    private readonly votesService: VotesService,
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
    @CurrentUser() user: Express.User | undefined,
  ): Promise<number | null> {
    if (!user) return null;
    return this.votesService.getUserVoteValue(user.id, post.id);
  }

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

  @Query(() => [PostEntity])
  async getPostsByUser(@Args('userId') userId: string): Promise<PostEntity[]> {
    return this.postsService.findByUser(userId);
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
