import { Field, ID, Int, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class CollectionItem {
  @Field(() => ID)
  id: string;

  @Field(() => String)
  postId: string;

  @Field(() => Int)
  position: number;
}
