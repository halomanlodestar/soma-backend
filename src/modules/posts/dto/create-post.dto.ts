import {
  IsString,
  IsNotEmpty,
  IsUUID,
  IsOptional,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { InputType, Field } from '@nestjs/graphql';
import { CreateMediaItemDto } from './create-media-item.dto';

@InputType()
export class CreatePostDto {
  @Field(() => String)
  @IsString()
  @IsNotEmpty()
  title: string;

  @Field(() => String, { nullable: true })
  @IsString()
  @IsOptional()
  body?: string;

  @Field(() => String)
  @IsUUID()
  @IsNotEmpty()
  somaId: string;

  @Field(() => [CreateMediaItemDto], { nullable: true })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateMediaItemDto)
  @IsOptional()
  media?: CreateMediaItemDto[];
}
