import { IsEnum, IsNotEmpty, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { VoteTargetType } from '../../../prisma/generated/client';

export class DeleteVoteDto {
  @ApiProperty({
    description: 'The type of the target being un-voted',
    enum: VoteTargetType,
    example: 'POST',
  })
  @IsEnum(VoteTargetType)
  @IsNotEmpty()
  targetType: VoteTargetType;

  @ApiProperty({
    description: 'The UUID of the target being un-voted',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  @IsNotEmpty()
  targetId: string;
}
