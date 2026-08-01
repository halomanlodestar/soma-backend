import { Field, InputType } from '@nestjs/graphql';
import { IsBoolean, IsUUID } from 'class-validator';

@InputType()
export class ReviewSomaJoinRequestInput {
  @Field(() => String)
  @IsUUID()
  somaId: string;

  @Field(() => String)
  @IsUUID()
  userId: string;

  @Field(() => Boolean)
  @IsBoolean()
  approve: boolean;
}
