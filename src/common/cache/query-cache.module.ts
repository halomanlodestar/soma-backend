import { CacheModule } from '@nestjs/cache-manager';
import { Global, Module } from '@nestjs/common';
import { QueryCacheService } from './query-cache.service';

@Global()
@Module({
  imports: [CacheModule.register()],
  providers: [QueryCacheService],
  exports: [QueryCacheService],
})
export class QueryCacheModule {}
