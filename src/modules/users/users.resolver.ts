import { Resolver, Query, Mutation, Args } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { UserResponseDto } from './dto/user-response.dto';
import { UpdateUserProfileDto } from './dto/update-user-profile.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { Express } from 'express';

@Resolver(() => UserResponseDto)
export class UsersResolver {
  constructor(private readonly usersService: UsersService) {}

  @Query(() => UserResponseDto, { name: 'getMyProfile' })
  @UseGuards(JwtAuthGuard)
  async getMyProfile(
    @CurrentUser() user: Express.User,
  ): Promise<UserResponseDto> {
    return this.usersService.findById(user.id);
  }

  @Query(() => UserResponseDto, { name: 'userByUsername' })
  async getUserByUsername(
    @Args('username') username: string,
  ): Promise<UserResponseDto> {
    return this.usersService.findByUsername(username);
  }

  @Mutation(() => UserResponseDto)
  @UseGuards(JwtAuthGuard)
  async updateMyProfile(
    @CurrentUser() user: Express.User,
    @Args('data') updateUserProfileDto: UpdateUserProfileDto,
  ): Promise<UserResponseDto> {
    return this.usersService.updateProfile(user.id, updateUserProfileDto);
  }
}
