import {
  Resolver,
  Query,
  Mutation,
  Args,
  createUnionType,
} from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { UsersService, UserResult } from './users.service';
import { UserResponseDto } from './dto/user-response.dto';
import { UpdateUserProfileDto } from './dto/update-user-profile.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { Express } from 'express';
import { NotFoundError } from '../../common/errors/graphql-errors';

export const UserResultUnion = createUnionType({
  name: 'UserResult',
  types: () => [UserResponseDto, NotFoundError] as const,
  resolveType: (value) => {
    if (value instanceof NotFoundError) {
      return NotFoundError;
    }

    return UserResponseDto;
  },
});

@Resolver(() => UserResponseDto)
export class UsersResolver {
  constructor(private readonly usersService: UsersService) {}

  @Query(() => UserResultUnion, { name: 'getMyProfile' })
  @UseGuards(JwtAuthGuard)
  async getMyProfile(@CurrentUser() user: Express.User): Promise<UserResult> {
    return this.usersService.findById(user.id);
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
