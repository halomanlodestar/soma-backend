import { ObjectType, Field, ID, Int } from '@nestjs/graphql';
import { Vote as PrismaVote } from '../../../prisma/generated/client';

@ObjectType()
export class Vote implements PrismaVote {
  @Field(() => ID)
  id: string;

  @Field(() => String)
  userId: string;

  @Field(() => String, { nullable: true })
  postId: string | null;

  @Field(() => String, { nullable: true })
  commentId: string | null;

  @Field(() => Int)
  value: number;

  @Field(() => Date)
  createdAt: Date;
}
