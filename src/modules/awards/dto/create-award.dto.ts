import { IsEnum, IsNotEmpty, IsString, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { AwardTargetType } from '../../../prisma/generated/client';

export class CreateAwardDto {
  @ApiProperty({
    description: 'The type of the target being awarded',
    enum: AwardTargetType,
    example: 'POST',
  })
  @IsEnum(AwardTargetType)
  @IsNotEmpty()
  targetType: AwardTargetType;

  @ApiProperty({
    description: 'The UUID of the target being awarded',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  @IsNotEmpty()
  targetId: string;

  @ApiProperty({
    description: 'Name of the award',
    example: 'Gold',
  })
  @IsString()
  @IsNotEmpty()
  name: string;
}
