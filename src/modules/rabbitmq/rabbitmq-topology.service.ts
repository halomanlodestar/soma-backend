import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  connect,
  type AmqpConnectionManager,
  type ChannelWrapper,
} from 'amqp-connection-manager';
import type { ConfirmChannel } from 'amqplib';

export const COMMANDS_QUEUE = 'soma_commands_queue';
// Version the queue because RabbitMQ queue arguments are immutable after creation.
// Keep the original queue available for an explicit drain/retirement operation.
export const NOTIFICATIONS_QUEUE = 'soma_notifications_v2_queue';
export const COMMANDS_DLQ = 'soma_commands_dlq';
export const NOTIFICATIONS_DLQ = 'soma_notifications_dlq';
export const DEAD_LETTER_EXCHANGE = 'soma.dead-letter';

export const commandsQueueOptions = {
  durable: true,
  arguments: {
    'x-dead-letter-exchange': DEAD_LETTER_EXCHANGE,
    'x-dead-letter-routing-key': COMMANDS_DLQ,
  },
};

export const notificationsQueueOptions = {
  durable: true,
  arguments: {
    'x-dead-letter-exchange': DEAD_LETTER_EXCHANGE,
    'x-dead-letter-routing-key': NOTIFICATIONS_DLQ,
  },
};

@Injectable()
export class RabbitMqTopologyService implements OnModuleInit, OnModuleDestroy {
  private connection: AmqpConnectionManager;
  private channel: ChannelWrapper;

  constructor(private readonly config: ConfigService) {}

  async onModuleInit(): Promise<void> {
    const url =
      this.config.get<string>('RABBITMQ_URL') || 'amqp://localhost:5672';
    this.connection = connect([url]);

    this.channel = this.connection.createChannel({
      setup: async (channel: ConfirmChannel) => {
        await channel.assertExchange(DEAD_LETTER_EXCHANGE, 'direct', {
          durable: true,
        });
        await channel.assertQueue(COMMANDS_DLQ, { durable: true });
        await channel.bindQueue(
          COMMANDS_DLQ,
          DEAD_LETTER_EXCHANGE,
          COMMANDS_DLQ,
        );
        await channel.assertQueue(NOTIFICATIONS_DLQ, { durable: true });
        await channel.bindQueue(
          NOTIFICATIONS_DLQ,
          DEAD_LETTER_EXCHANGE,
          NOTIFICATIONS_DLQ,
        );
      },
    });

    await this.channel.waitForConnect();
  }

  async onModuleDestroy(): Promise<void> {
    await this.channel?.close();
    await this.connection?.close();
  }
}
