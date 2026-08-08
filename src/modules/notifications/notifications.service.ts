import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import type { Prisma } from '../../prisma/generated/client';
import { Notification } from './entities/notification.entity';
import {
  NotFoundError,
  UnauthorizedError,
} from '../../common/errors/graphql-errors';
import { NotificationResult } from './types/notification-result.type';
import type { CreateNotificationEvent } from './types/notification-events.type';

@Injectable()
export class NotificationsService {
  constructor(private readonly prisma: PrismaService) {}

  async processCreate(event: CreateNotificationEvent): Promise<Notification> {
    const notification = await this.prisma.notification.upsert({
      where: { sourceEventId: event.sourceEventId },
      create: {
        sourceEventId: event.sourceEventId,
        recipientId: event.recipientId,
        actorId: event.actorId,
        eventType: event.eventType,
        eventData: event.eventData as Prisma.InputJsonValue,
      },
      update: {},
    });

    return notification;
  }

  async findAll(recipientId: string): Promise<Notification[]> {
    return this.prisma.notification.findMany({
      where: { recipientId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async markAsRead(
    userId: string,
    notificationId: string,
  ): Promise<NotificationResult> {
    const notification = await this.prisma.notification.findUnique({
      where: { id: notificationId },
    });

    if (!notification) {
      return new NotFoundError(
        `Notification with id '${notificationId}' not found`,
      );
    }

    if (notification.recipientId !== userId) {
      return new UnauthorizedError('You can only read your own notifications');
    }

    return this.prisma.notification.update({
      where: { id: notificationId },
      data: { readAt: new Date() },
    });
  }
}
