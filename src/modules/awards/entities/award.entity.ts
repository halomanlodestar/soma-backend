import { ObjectType, Field, ID } from '@nestjs/graphql';
import { Award as PrismaAward } from '../../../prisma/generated/client';

@ObjectType()
export class Award implements PrismaAward {
  @Field(() => ID)
  id: string;

  @Field(() => String)
  awardedById: string;

  @Field(() => String, { nullable: true })
  postId: string | null;

  @Field(() => String, { nullable: true })
  commentId: string | null;

  @Field(() => String)
  name: string;

  @Field(() => Date)
  createdAt: Date;
}
