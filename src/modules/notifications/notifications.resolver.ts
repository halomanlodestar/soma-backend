import { NotificationResultUnion } from './dto/notifications-results.dto';
import { Resolver, Query, Mutation, Args } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import {
  NotificationsService,
  NotificationResult,
} from './notifications.service';
import { Notification as NotificationEntity } from './entities/notification.entity';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { Express } from 'express';

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
