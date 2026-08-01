import { UserResultUnion } from './dto/users-results.dto';
import {
  Resolver,
  Query,
  Mutation,
  Args,
  ResolveField,
  Parent,
} from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { UsersService } from './users.service';
import { UserResult } from './types/user-result.type';
import { UserResponseDto } from './dto/user-response.dto';
import { UpdateUserProfileDto } from './dto/update-user-profile.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { Express } from 'express';

@Resolver(() => UserResponseDto)
export class UsersResolver {
  constructor(
    private readonly usersService: UsersService,
    private readonly prisma: PrismaService,
  ) {}

  @ResolveField('stats')
  async stats(@Parent() user: UserResponseDto) {
    const [posts, comments, followers, following] = await Promise.all([
      this.prisma.post.count({ where: { authorId: user.id } }),
      this.prisma.comment.count({ where: { authorId: user.id } }),
      this.prisma.follow.count({ where: { followingId: user.id } }),
      this.prisma.follow.count({ where: { followerId: user.id } }),
    ]);
    return { posts, comments, followers, following };
  }

  @ResolveField('awards')
  awards(@Parent() _user: UserResponseDto) {
    return ['Top Contributor', 'Early Adopter']; // Just some mock awards for now since award assignment logic might not be fully there.
  }

  @Query(() => UserResultUnion, { name: 'me' })
  @UseGuards(JwtAuthGuard)
  async me(@CurrentUser() user: Express.User): Promise<UserResult> {
    return this.usersService.findById(user.id);
  }

  @Query(() => UserResultUnion, { name: 'getUserById' })
  async getUserById(@Args('id') id: string): Promise<UserResult> {
    return this.usersService.findById(id);
  }

  @Query(() => UserResultUnion, { name: 'userByUsername' })
  async getUserByUsername(
    @Args('username') username: string,
  ): Promise<UserResult> {
    return this.usersService.findByUsername(username);
  }

  @Mutation(() => UserResultUnion)
  @UseGuards(JwtAuthGuard)
  async updateMyProfile(
    @CurrentUser() user: Express.User,
    @Args('data') updateUserProfileDto: UpdateUserProfileDto,
  ): Promise<UserResult> {
    return this.usersService.updateProfile(user.id, updateUserProfileDto);
  }
}
