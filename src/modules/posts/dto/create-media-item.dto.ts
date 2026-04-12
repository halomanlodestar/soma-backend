import { IsString, IsNotEmpty, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { MediaType } from '../../../prisma/generated/client';

export class CreateMediaItemDto {
  @ApiProperty({
    description: 'Type of media',
    enum: ['IMAGE', 'VIDEO', 'AUDIO'],
    example: 'IMAGE',
  })
  @IsEnum(['IMAGE', 'VIDEO', 'AUDIO'])
  @IsNotEmpty()
  type: MediaType;

  @ApiProperty({
    description: 'S3 key returned from upload-intent',
    example: 'soma/user-id/1744444800000-f3a9c1b2e4d50f87.jpg',
  })
  @IsString()
  @IsNotEmpty()
  key: string;
}
