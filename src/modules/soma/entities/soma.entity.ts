import { ObjectType, Field, ID, Int } from '@nestjs/graphql';
import { SomaMembershipMode } from '../../soma-memberships/types/soma-access.enums';

@ObjectType()
export class Soma {
  @Field(() => ID)
  id: string;

  @Field(() => String)
  slug: string;

  @Field(() => String)
  name: string;

  @Field(() => String, { nullable: true })
  description: string | null;

  @Field(() => String, { nullable: true })
  coverUrl?: string | null;

  @Field(() => Int, { defaultValue: 0 })
  memberCount: number;

  @Field(() => Int, { defaultValue: 0 })
  weeklyVisitorCount: number;

  @Field(() => SomaMembershipMode)
  membershipMode: SomaMembershipMode;

  @Field(() => Date)
  createdAt: Date;

  @Field(() => Date)
  updatedAt: Date;
}
