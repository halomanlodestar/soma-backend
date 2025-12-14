import { ApiProperty } from '@nestjs/swagger';
import { Notification as PrismaNotification } from '../../../prisma/generated/client';

export class Notification implements PrismaNotification {
  @ApiProperty({ description: 'Notification UUID' })
  id: string;

  @ApiProperty({ description: 'Recipient User UUID' })
  userId: string;

  @ApiProperty({ description: 'Notification type (e.g. COMMENT, AWARD)' })
  type: string;

  @ApiProperty({ description: 'Notification message' })
  message: string;

  @ApiProperty({
    description: 'Target type (e.g. POST, COMMENT)',
    nullable: true,
  })
  targetType: string | null;

  @ApiProperty({ description: 'Target UUID', nullable: true })
  targetId: string | null;

  @ApiProperty({ description: 'Read timestamp', nullable: true })
  readAt: Date | null;

  @ApiProperty({ description: 'Creation timestamp' })
  createdAt: Date;
}
