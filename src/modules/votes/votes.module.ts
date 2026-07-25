import { Module } from '@nestjs/common';
import { VotesService } from './votes.service';
import { VotesResolver } from './votes.resolver';
import { PrismaService } from '../../prisma/prisma.service';

@Module({
  providers: [VotesService, VotesResolver, PrismaService],
})
export class VotesModule {}
