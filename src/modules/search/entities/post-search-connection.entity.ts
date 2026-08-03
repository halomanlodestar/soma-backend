import { Field, Int, ObjectType } from '@nestjs/graphql';
import { PageInfo } from '../../../common/pagination/entities/page-info.entity';
import { Post } from '../../posts/entities/post.entity';

@ObjectType()
export class PostSearchConnection {
  @Field(() => [Post])
  nodes: Post[];

  @Field(() => PageInfo)
  pageInfo: PageInfo;

  @Field(() => Int)
  totalCount: number;
}
