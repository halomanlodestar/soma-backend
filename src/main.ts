import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import {
  COMMANDS_QUEUE,
  NOTIFICATIONS_QUEUE,
  commandsQueueOptions,
  notificationsQueueOptions,
} from './modules/rabbitmq/rabbitmq-topology.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    cors: {
      origin: [
        'http://localhost:3000',
        'https://www.soggyroll.art',
        'https://soggyroll.art',
      ],
    },
  });

  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.RMQ,
    options: {
      urls: [process.env.RABBITMQ_URL || 'amqp://localhost:5672'],
      queue: COMMANDS_QUEUE,
      queueOptions: commandsQueueOptions,
      noAck: false,
      prefetchCount: 50,
    },
  });

  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.RMQ,
    options: {
      urls: [process.env.RABBITMQ_URL || 'amqp://localhost:5672'],
      queue: 'soma_events_queue',
      queueOptions: {
        durable: true,
      },
      noAck: false,
      prefetchCount: 500,
    },
  });

  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.RMQ,
    options: {
      urls: [process.env.RABBITMQ_URL || 'amqp://localhost:5672'],
      queue: NOTIFICATIONS_QUEUE,
      queueOptions: notificationsQueueOptions,
      noAck: false,
      prefetchCount: 50,
    },
  });

  app.setGlobalPrefix('api/v1');

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );

  await app.startAllMicroservices();
  await app.listen(process.env.PORT ?? 8000);
}

void bootstrap();
