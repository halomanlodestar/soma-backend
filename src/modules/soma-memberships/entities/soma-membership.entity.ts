import { Field, ID, ObjectType } from '@nestjs/graphql';
import {
  SomaMembershipRole,
  SomaMembershipStatus,
} from '../types/soma-access.enums';

@ObjectType()
export class SomaMembership {
  @Field(() => ID)
  id: string;

  @Field(() => String)
  userId: string;

  @Field(() => String)
  somaId: string;

  @Field(() => SomaMembershipRole)
  role: SomaMembershipRole;

  @Field(() => SomaMembershipStatus)
  status: SomaMembershipStatus;

  @Field(() => String, { nullable: true })
  approvedById: string | null;

  @Field(() => Date, { nullable: true })
  approvedAt: Date | null;

  @Field(() => Date, { nullable: true })
  suspendedAt: Date | null;

  @Field(() => Date, { nullable: true })
  leftAt: Date | null;

  @Field(() => Date)
  createdAt: Date;

  @Field(() => Date)
  updatedAt: Date;
}
