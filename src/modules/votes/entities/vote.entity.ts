import { ApiProperty } from '@nestjs/swagger';
import {
  Vote as PrismaVote,
  VoteTargetType,
} from '../../../prisma/generated/client';

export class Vote implements PrismaVote {
  @ApiProperty({ description: 'Vote UUID' })
  id: string;

  @ApiProperty({ description: 'User UUID who cast the vote' })
  userId: string;

  @ApiProperty({ description: 'Target type', enum: VoteTargetType })
  targetType: VoteTargetType;

  @ApiProperty({ description: 'Target UUID' })
  targetId: string;

  @ApiProperty({ description: 'Vote value (+1 or -1)' })
  value: number;

  @ApiProperty({ description: 'Creation timestamp' })
  createdAt: Date;
}
