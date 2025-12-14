import {
  IsArray,
  IsString,
  IsNotEmpty,
  IsEnum,
  IsOptional,
  ValidateNested,
  ArrayMinSize,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { MediaType } from '../../../prisma/generated/client';

export class MediaItemDto {
  @ApiProperty({
    description: 'Type of media',
    enum: ['IMAGE', 'VIDEO', 'AUDIO'],
    example: 'IMAGE',
  })
  @IsEnum(['IMAGE', 'VIDEO', 'AUDIO'])
  @IsNotEmpty()
  type: MediaType;

  @ApiProperty({
    description: 'URL of the uploaded media',
    example: 'https://bucket.s3.region.amazonaws.com/soma/user-id/...',
  })
  @IsString()
  @IsNotEmpty()
  originalUrl: string;

  @ApiProperty({
    description: 'Optional metadata for the media item',
    required: false,
    example: { width: 1920, height: 1080 },
  })
  @IsOptional()
  metadata?: Record<string, any>;
}

export class AttachMediaDto {
  @ApiProperty({
    description: 'Array of media items to attach to the post',
    type: [MediaItemDto],
  })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => MediaItemDto)
  media: MediaItemDto[];
}
