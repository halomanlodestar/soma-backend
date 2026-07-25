import { ObjectType, Field, ID, Int } from '@nestjs/graphql';

@ObjectType()
export class Post {
  @Field(() => ID)
  id: string;

  @Field(() => String)
  title: string;

  @Field(() => String, { nullable: true })
  body: string | null;

  @Field(() => String)
  authorId: string;

  @Field(() => String)
  somaId: string;

  @Field(() => Int)
  impressions: number;

  @Field(() => Date)
  createdAt: Date;

  @Field(() => Date)
  updatedAt: Date;
}
