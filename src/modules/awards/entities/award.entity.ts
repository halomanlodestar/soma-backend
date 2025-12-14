import { ApiProperty } from '@nestjs/swagger';
import {
  Award as PrismaAward,
  AwardTargetType,
} from '../../../prisma/generated/client';

export class Award implements PrismaAward {
  @ApiProperty({ description: 'Award UUID' })
  id: string;

  @ApiProperty({ description: 'User UUID who gave the award' })
  awardedById: string;

  @ApiProperty({ description: 'Target type', enum: AwardTargetType })
  targetType: AwardTargetType;

  @ApiProperty({ description: 'Target UUID' })
  targetId: string;

  @ApiProperty({ description: 'Name of the award' })
  name: string;

  @ApiProperty({ description: 'Creation timestamp' })
  createdAt: Date;
}
