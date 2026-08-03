import { Args, Query, Resolver } from '@nestjs/graphql';
import { SearchService } from './search.service';
import { AutocompleteInput, SearchPostsInput } from './dto/search.inputs';
import { AutocompleteResult } from './entities/autocomplete-result.entity';
import { PostSearchConnection } from './entities/post-search-connection.entity';

@Resolver()
export class SearchResolver {
  constructor(private readonly searchService: SearchService) {}

  @Query(() => PostSearchConnection)
  searchPosts(@Args('input') input: SearchPostsInput) {
    return this.searchService.searchPosts(input);
  }

  @Query(() => [AutocompleteResult])
  autocomplete(@Args('input') input: AutocompleteInput) {
    return this.searchService.autocomplete(input);
  }
}
