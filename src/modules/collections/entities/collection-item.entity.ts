import { Field, ID, Int, ObjectType } from '@nestjs/graphql';
import { Post } from '../../posts/entities/post.entity';

@ObjectType()
export class CollectionItem {
  @Field(() => ID)
  id: string;

  @Field(() => String)
  postId: string;

  @Field(() => Int)
  position: number;

  @Field(() => Post)
  post: Post;
}
