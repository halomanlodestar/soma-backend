import { TargetType } from '../dto/create-vote.dto';

export class VoteEvent {
  userId: string;
  targetType: TargetType;
  targetId: string;
  value?: number;
}
