import { Injectable } from '@nestjs/common';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { PrismaService } from '../../prisma/prisma.service';
import { Notification } from './entities/notification.entity';
import {
  NotFoundError,
  UnauthorizedError,
} from '../../common/errors/graphql-errors';
import { NotificationResult } from './types/notification-result.type';

@Injectable()
export class NotificationsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    createNotificationDto: CreateNotificationDto,
  ): Promise<Notification> {
    const { userId, type, message, postId, commentId } = createNotificationDto;

    return this.prisma.notification.create({
      data: {
        userId,
        type,
        message,
        postId,
        commentId,
      },
    });
  }

  async findAll(userId: string): Promise<Notification[]> {
    return this.prisma.notification.findMany({
      where: { userId },
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

    if (notification.userId !== userId) {
      return new UnauthorizedError('You can only read your own notifications');
    }

    return this.prisma.notification.update({
      where: { id: notificationId },
      data: { readAt: new Date() },
    });
  }
}
