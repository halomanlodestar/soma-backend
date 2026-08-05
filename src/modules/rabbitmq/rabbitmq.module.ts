import { Global, Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { ConfigService, ConfigModule } from '@nestjs/config';
import {
  COMMANDS_QUEUE,
  NOTIFICATIONS_QUEUE,
  commandsQueueOptions,
  notificationsQueueOptions,
  RabbitMqTopologyService,
} from './rabbitmq-topology.service';

@Global()
@Module({
  imports: [
    ClientsModule.registerAsync([
      {
        name: 'RMQ_CLIENT',
        imports: [ConfigModule],
        inject: [ConfigService],
        useFactory: (config: ConfigService) => ({
          transport: Transport.RMQ,
          options: {
            urls: [
              config.get<string>('RABBITMQ_URL') || 'amqp://localhost:5672',
            ],
            queue: 'soma_events_queue',
            queueOptions: {
              durable: true,
            },
          },
        }),
      },
      {
        name: 'COMMANDS_RMQ_CLIENT',
        imports: [ConfigModule],
        inject: [ConfigService],
        useFactory: (config: ConfigService) => ({
          transport: Transport.RMQ,
          options: {
            urls: [
              config.get<string>('RABBITMQ_URL') || 'amqp://localhost:5672',
            ],
            queue: COMMANDS_QUEUE,
            queueOptions: commandsQueueOptions,
          },
        }),
      },
      {
        name: 'NOTIFICATIONS_RMQ_CLIENT',
        imports: [ConfigModule],
        inject: [ConfigService],
        useFactory: (config: ConfigService) => ({
          transport: Transport.RMQ,
          options: {
            urls: [
              config.get<string>('RABBITMQ_URL') || 'amqp://localhost:5672',
            ],
            queue: NOTIFICATIONS_QUEUE,
            queueOptions: notificationsQueueOptions,
          },
        }),
      },
    ]),
  ],
  providers: [RabbitMqTopologyService],
  exports: [ClientsModule],
})
export class RabbitMQModule {}
