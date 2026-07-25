import {
  IsArray,
  IsString,
  IsNotEmpty,
  IsEnum,
  ValidateNested,
  ArrayMinSize,
} from 'class-validator';
import { Type } from 'class-transformer';
import { InputType, Field } from '@nestjs/graphql';
import { MediaType } from '../../../prisma/generated/client';

@InputType()
export class MediaItemDto {
  @Field(() => String)
  @IsEnum(['IMAGE', 'VIDEO', 'AUDIO'])
  @IsNotEmpty()
  type: MediaType;

  @Field(() => String)
  @IsString()
  @IsNotEmpty()
  originalUrl: string;
}

@InputType()
export class AttachMediaDto {
  @Field(() => [MediaItemDto])
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => MediaItemDto)
  media: MediaItemDto[];
}
