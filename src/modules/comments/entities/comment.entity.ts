import { ObjectType, Field, ID } from '@nestjs/graphql';
import { Comment as PrismaComment } from '../../../prisma/generated/client';

@ObjectType()
export class Comment implements PrismaComment {
  @Field(() => ID)
  id: string;

  @Field(() => String)
  content: string;

  @Field(() => String)
  authorId: string;

  @Field(() => String)
  postId: string;

  @Field(() => String, { nullable: true })
  parentCommentId: string | null;

  @Field(() => Date)
  createdAt: Date;

  @Field(() => Date)
  updatedAt: Date;
}
