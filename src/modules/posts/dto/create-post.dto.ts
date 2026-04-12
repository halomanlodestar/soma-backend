import {
  IsString,
  IsNotEmpty,
  IsUUID,
  IsOptional,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { CreateMediaItemDto } from './create-media-item.dto';

export class CreatePostDto {
  @ApiProperty({
    description: 'Title of the post',
    example: 'The Future of AI in 2025',
  })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({
    description: 'Body/content of the post',
    example: 'Here are my thoughts on AI developments...',
    required: false,
  })
  @IsString()
  @IsOptional()
  body?: string;

  @ApiProperty({
    description: 'UUID of the soma where the post will be created',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  @IsNotEmpty()
  somaId: string;

  @ApiProperty({
    description: 'Media items to attach — each key comes from upload-intent',
    type: [CreateMediaItemDto],
    required: false,
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateMediaItemDto)
  @IsOptional()
  media?: CreateMediaItemDto[];
}
