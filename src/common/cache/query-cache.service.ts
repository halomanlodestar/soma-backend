import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject, Injectable } from '@nestjs/common';
import type { Cache } from 'cache-manager';

@Injectable()
export class QueryCacheService {
  constructor(@Inject(CACHE_MANAGER) private readonly cache: Cache) {}

  async getOrSet<T>(
    key: string,
    ttl: number,
    factory: () => Promise<T>,
  ): Promise<T> {
    const cached = await this.cache.get<T>(key);

    if (cached !== undefined && cached !== null) {
      return cached;
    }

    const value = await factory();

    await this.cache.set(key, value, ttl);

    return value;
  }
}
