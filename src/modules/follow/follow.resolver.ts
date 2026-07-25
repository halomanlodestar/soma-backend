import {
  Resolver,
  Query,
  Mutation,
  Args,
  createUnionType,
} from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { FollowService, FollowResult } from './follow.service';
import {
  FollowResponse,
  FollowStatus,
  FollowUserDto,
} from './dto/follow-responses.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { Express } from 'express';
import {
  NotFoundError,
  InvalidInputError,
} from '../../common/errors/graphql-errors';

export const FollowResultUnion = createUnionType({
  name: 'FollowResult',
  types: () => [FollowResponse, NotFoundError, InvalidInputError] as const,
  resolveType: (value) => {
    if (value instanceof NotFoundError) return NotFoundError;
    if (value instanceof InvalidInputError) return InvalidInputError;
    return FollowResponse;
  },
});

@Resolver()
export class FollowResolver {
  constructor(private readonly followService: FollowService) {}

  @Mutation(() => FollowResultUnion)
  @UseGuards(JwtAuthGuard)
  async follow(
    @CurrentUser() user: Express.User,
    @Args('userId') followingId: string,
  ): Promise<FollowResult> {
    return this.followService.follow(user.id, followingId);
  }

  @Mutation(() => FollowResponse)
  @UseGuards(JwtAuthGuard)
  async unfollow(
    @CurrentUser() user: Express.User,
    @Args('userId') followingId: string,
  ): Promise<FollowResponse> {
    return this.followService.unfollow(user.id, followingId);
  }

  @Query(() => [FollowUserDto])
  async getFollowers(@Args('userId') userId: string): Promise<FollowUserDto[]> {
    return this.followService.getFollowers(userId);
  }

  @Query(() => [FollowUserDto])
  async getFollowing(@Args('userId') userId: string): Promise<FollowUserDto[]> {
    return this.followService.getFollowing(userId);
  }

  @Query(() => FollowStatus)
  @UseGuards(JwtAuthGuard)
  async getFollowStatus(
    @CurrentUser() user: Express.User,
    @Args('userId') followingId: string,
  ): Promise<FollowStatus> {
    return this.followService.getFollowStatus(user.id, followingId);
  }
}
