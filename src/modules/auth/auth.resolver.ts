import { UseGuards } from '@nestjs/common';
import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import type { Express } from 'express';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { AuthService } from './auth.service';
import { AuthSessionDto } from './dto/auth-session.dto';

@Resolver(() => AuthSessionDto)
@UseGuards(JwtAuthGuard)
export class AuthResolver {
  constructor(private readonly authService: AuthService) {}

  @Query(() => [AuthSessionDto])
  mySessions(@CurrentUser() user: Express.User) {
    return this.authService.listActiveSessions(user.id);
  }

  @Mutation(() => Boolean)
  revokeSession(
    @CurrentUser() user: Express.User,
    @Args('sessionId', { type: () => String }) sessionId: string,
  ) {
    return this.authService.revokeSession(user.id, sessionId);
  }

  @Mutation(() => Number)
  revokeAllSessions(@CurrentUser() user: Express.User) {
    return this.authService.revokeAllSessions(user.id);
  }
}
