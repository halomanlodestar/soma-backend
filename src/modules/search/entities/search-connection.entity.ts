import { Field, Int, ObjectType } from '@nestjs/graphql';
import { PageInfo } from '../../../common/pagination/entities/page-info.entity';
import { SearchResult } from './search-result.entity';

@ObjectType()
export class SearchConnection {
  @Field(() => [SearchResult])
  nodes: SearchResult[];

  @Field(() => PageInfo)
  pageInfo: PageInfo;

  @Field(() => Int)
  totalCount: number;
}
