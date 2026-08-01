import { Field, ID, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class Collection {
  @Field(() => ID)
  id: string;

  @Field(() => String)
  title: string;

  @Field(() => String, { nullable: true })
  description: string | null;

  @Field(() => Boolean)
  isPublic: boolean;
}
