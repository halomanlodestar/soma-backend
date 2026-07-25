import { ObjectType, Field, ID, Int } from '@nestjs/graphql';
import {
  Vote as PrismaVote,
  VoteTargetType,
} from '../../../prisma/generated/client';

@ObjectType()
export class Vote implements PrismaVote {
  @Field(() => ID)
  id: string;

  @Field(() => String)
  userId: string;

  @Field(() => String)
  targetType: VoteTargetType;

  @Field(() => String)
  targetId: string;

  @Field(() => Int)
  value: number;

  @Field(() => Date)
  createdAt: Date;
}
