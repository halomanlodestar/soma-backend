import { Args, Query, Resolver } from '@nestjs/graphql';
import { createHash } from 'crypto';
import { QueryCacheService } from '../../common/cache/query-cache.service';
import { SearchService } from './search.service';
import { AutocompleteInput, SearchPostsInput } from './dto/search.inputs';
import { AutocompleteResult } from './entities/autocomplete-result.entity';
import { PostSearchConnection } from './entities/post-search-connection.entity';

@Resolver()
export class SearchResolver {
  constructor(
    private readonly searchService: SearchService,
    private readonly queryCache: QueryCacheService,
  ) {}

  @Query(() => PostSearchConnection)
  searchPosts(@Args('input') input: SearchPostsInput) {
    return this.queryCache.getOrSet(this.searchCacheKey(input), 120_000, () =>
      this.searchService.searchPosts(input),
    );
  }

  @Query(() => [AutocompleteResult])
  autocomplete(@Args('input') input: AutocompleteInput) {
    return this.queryCache.getOrSet(
      this.autocompleteCacheKey(input),
      60_000,
      () => this.searchService.autocomplete(input),
    );
  }

  private searchCacheKey(input: SearchPostsInput): string {
    return [
      'query:search:posts:v1',
      this.queryHash(input.query),
      input.somaId ?? 'all',
      input.first,
      input.after ?? 'first-page',
    ].join(':');
  }

  private autocompleteCacheKey(input: AutocompleteInput): string {
    return [
      'query:search:autocomplete:v1',
      this.queryHash(input.query),
      input.first,
    ].join(':');
  }

  private queryHash(value: string): string {
    const normalized = value.trim().toLowerCase().replace(/\s+/g, ' ');
    return createHash('sha256').update(normalized).digest('base64url');
  }
}
