import { Resolver, Query } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UserResponseDto } from '../users/dto/user-response.dto';
import type { Express } from 'express';

@Resolver()
export class AuthResolver {
  @Query(() => UserResponseDto)
  @UseGuards(JwtAuthGuard)
  me(@CurrentUser() user: Express.User) {
    return user;
  }
}
