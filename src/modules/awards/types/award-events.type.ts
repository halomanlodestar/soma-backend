import { AwardTargetType } from '../dto/create-award.dto';

export type CreateAwardEvent = {
  commandId: string;
  userId: string;
  targetType: AwardTargetType;
  targetId: string;
  name: string;
};
