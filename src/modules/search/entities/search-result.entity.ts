import { Field, ID, ObjectType } from '@nestjs/graphql';
import { SearchResultKind } from '../types/search-result-kind.enum';

@ObjectType()
export class SearchResult {
  @Field(() => SearchResultKind)
  kind: SearchResultKind;

  @Field(() => ID)
  id: string;

  @Field(() => String)
  title: string;

  @Field(() => String, { nullable: true })
  subtitle: string | null;

  @Field(() => String, { nullable: true })
  slug: string | null;

  @Field(() => String, { nullable: true })
  imageUrl: string | null;
}
