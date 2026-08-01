import { Field, InputType } from '@nestjs/graphql';
import { IsEnum, IsUUID } from 'class-validator';
import { SomaMembershipStatus } from '../types/soma-access.enums';

@InputType()
export class SetSomaMembershipStatusInput {
  @Field(() => String)
  @IsUUID()
  somaId: string;

  @Field(() => String)
  @IsUUID()
  userId: string;

  @Field(() => SomaMembershipStatus)
  @IsEnum(SomaMembershipStatus)
  status: SomaMembershipStatus;
}
