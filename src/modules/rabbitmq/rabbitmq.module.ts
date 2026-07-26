import { Global, Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { ConfigService, ConfigModule } from '@nestjs/config';

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
    ]),
  ],
  exports: [ClientsModule],
})
export class RabbitMQModule {}
