import { IsNotEmpty, IsString } from 'class-validator';
import { InputType, Field } from '@nestjs/graphql';

@InputType()
export class CreateCommentDto {
  @Field(() => String)
  @IsString()
  @IsNotEmpty()
  content: string;
}
