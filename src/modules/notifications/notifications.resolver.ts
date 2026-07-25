import {
  Resolver,
  Query,
  Mutation,
  Args,
  createUnionType,
} from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import {
  NotificationsService,
  NotificationResult,
} from './notifications.service';
import { Notification as NotificationEntity } from './entities/notification.entity';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { Express } from 'express';
import {
  NotFoundError,
  UnauthorizedError,
} from '../../common/errors/graphql-errors';

export const NotificationResultUnion = createUnionType({
  name: 'NotificationResult',
  types: () => [NotificationEntity, NotFoundError, UnauthorizedError] as const,
  resolveType: (value) => {
    if (value instanceof NotFoundError) return NotFoundError;
    if (value instanceof UnauthorizedError) return UnauthorizedError;
    return NotificationEntity;
  },
});

@Resolver(() => NotificationEntity)
export class NotificationsResolver {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Query(() => [NotificationEntity])
  @UseGuards(JwtAuthGuard)
  async getNotifications(
    @CurrentUser() user: Express.User,
  ): Promise<NotificationEntity[]> {
    return this.notificationsService.findAll(user.id);
  }

  @Mutation(() => NotificationResultUnion)
  @UseGuards(JwtAuthGuard)
  async markNotificationAsRead(
    @CurrentUser() user: Express.User,
    @Args('id') id: string,
  ): Promise<NotificationResult> {
    return this.notificationsService.markAsRead(user.id, id);
  }
}
