import { Controller, Logger } from '@nestjs/common';
import { Ctx, EventPattern, Payload, RmqContext } from '@nestjs/microservices';
import type { Channel, ConsumeMessage } from 'amqplib';
import { NotificationsService } from './notifications.service';
import type { CreateNotificationEvent } from './types/notification-events.type';

@Controller()
export class NotificationsWorkerController {
  private readonly logger = new Logger(NotificationsWorkerController.name);

  constructor(private readonly notificationsService: NotificationsService) {}

  @EventPattern('notification.create')
  async create(
    @Payload() event: CreateNotificationEvent,
    @Ctx() context: RmqContext,
  ): Promise<void> {
    const channel = context.getChannelRef() as unknown as Channel;
    const message = context.getMessage() as unknown as ConsumeMessage;

    try {
      await this.notificationsService.processCreate(event);
      channel.ack(message);
    } catch (error: unknown) {
      this.logger.error(
        'Notification event failed',
        error instanceof Error ? error.stack : undefined,
      );
      channel.nack(message, false, false);
    }
  }
}
