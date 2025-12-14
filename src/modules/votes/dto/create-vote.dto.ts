import { IsEnum, IsInt, IsNotEmpty, IsUUID, IsIn } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { VoteTargetType } from '../../../prisma/generated/client';

export class CreateVoteDto {
  @ApiProperty({
    description: 'The type of the target being voted on',
    enum: VoteTargetType,
    example: 'POST',
  })
  @IsEnum(VoteTargetType)
  @IsNotEmpty()
  targetType: VoteTargetType;

  @ApiProperty({
    description: 'The UUID of the target being voted on',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  @IsNotEmpty()
  targetId: string;

  @ApiProperty({
    description: 'The value of the vote: +1 (upvote) or -1 (downvote)',
    example: 1,
    enum: [1, -1],
  })
  @IsInt()
  @IsIn([1, -1])
  @IsNotEmpty()
  value: number;
}
