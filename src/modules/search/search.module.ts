import { Module } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { SearchResolver } from './search.resolver';
import { SearchService } from './search.service';

@Module({
  providers: [SearchResolver, SearchService, PrismaService],
})
export class SearchModule {}
