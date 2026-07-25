import { IsString, IsNotEmpty, IsEnum } from 'class-validator';
import { InputType, Field } from '@nestjs/graphql';
import { MediaType } from '../../../prisma/generated/client';

@InputType()
export class CreateMediaItemDto {
  @Field(() => String)
  @IsEnum(['IMAGE', 'VIDEO', 'AUDIO'])
  @IsNotEmpty()
  type: MediaType;

  @Field(() => String)
  @IsString()
  @IsNotEmpty()
  key: string;
}
