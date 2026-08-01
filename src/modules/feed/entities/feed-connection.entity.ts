import { Field, Int, ObjectType } from '@nestjs/graphql';
import { PageInfo } from '../../../common/pagination/entities/page-info.entity';
import { FeedItem } from './feed-item.entity';

@ObjectType()
export class FeedConnection {
  @Field(() => [FeedItem])
  nodes: FeedItem[];

  @Field(() => PageInfo)
  pageInfo: PageInfo;

  @Field(() => Int)
  totalCount: number;
}
