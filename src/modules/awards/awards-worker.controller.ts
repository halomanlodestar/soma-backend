import { Controller, Logger } from '@nestjs/common';
import { Ctx, EventPattern, Payload, RmqContext } from '@nestjs/microservices';
import type { Channel, ConsumeMessage } from 'amqplib';
import { AwardsService } from './awards.service';
import type { CreateAwardEvent } from './types/award-events.type';

@Controller()
export class AwardsWorkerController {
  private readonly logger = new Logger(AwardsWorkerController.name);

  constructor(private readonly awardsService: AwardsService) {}

  @EventPattern('award.create')
  async create(
    @Payload() event: CreateAwardEvent,
    @Ctx() context: RmqContext,
  ): Promise<void> {
    const channel = context.getChannelRef() as unknown as Channel;
    const message = context.getMessage() as unknown as ConsumeMessage;

    try {
      await this.awardsService.processCreate(event);
      channel.ack(message);
    } catch (error: unknown) {
      this.logger.error(
        'Award command failed',
        error instanceof Error ? error.stack : undefined,
      );
      channel.nack(message, false, false);
    }
  }
}
