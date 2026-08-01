import { Field, InputType } from '@nestjs/graphql';
import { IsEnum, IsUUID } from 'class-validator';
import { SomaMembershipRole } from '../types/soma-access.enums';

@InputType()
export class SetSomaMembershipRoleInput {
  @Field(() => String)
  @IsUUID()
  somaId: string;

  @Field(() => String)
  @IsUUID()
  userId: string;

  @Field(() => SomaMembershipRole)
  @IsEnum(SomaMembershipRole)
  role: SomaMembershipRole;
}
