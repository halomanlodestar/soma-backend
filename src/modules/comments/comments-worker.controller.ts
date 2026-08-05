import { Controller, Logger } from '@nestjs/common';
import { Ctx, EventPattern, Payload, RmqContext } from '@nestjs/microservices';
import type { Channel, ConsumeMessage } from 'amqplib';
import { CommentsService } from './comments.service';
import type { CreateCommentEvent } from './types/comment-events.type';

@Controller()
export class CommentsWorkerController {
  private readonly logger = new Logger(CommentsWorkerController.name);

  constructor(private readonly commentsService: CommentsService) {}

  @EventPattern('comment.create')
  async create(
    @Payload() event: CreateCommentEvent,
    @Ctx() context: RmqContext,
  ): Promise<void> {
    await this.handle(context, () => this.commentsService.processCreate(event));
  }

  private async handle(context: RmqContext, work: () => Promise<void>) {
    const channel = context.getChannelRef() as unknown as Channel;
    const message = context.getMessage() as unknown as ConsumeMessage;

    try {
      await work();
      channel.ack(message);
    } catch (error: unknown) {
      this.logger.error(
        'Comment command failed',
        error instanceof Error ? error.stack : undefined,
      );
      channel.nack(message, false, false);
    }
  }
}
