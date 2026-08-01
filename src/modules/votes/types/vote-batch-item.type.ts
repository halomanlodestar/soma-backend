import type { RmqContext } from '@nestjs/microservices';
import type { VoteEvent } from './vote-events.type';

export interface VoteBatchItem {
  event: VoteEvent;
  type: 'cast' | 'remove';
  context: RmqContext;
}
