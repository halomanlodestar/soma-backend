import { Module } from '@nestjs/common';
import { VotesService } from './votes.service';
import { VotesResolver } from './votes.resolver';
import { PrismaService } from '../../prisma/prisma.service';
import { VotesWorkerController } from './votes-worker.controller';

@Module({
  controllers: [VotesWorkerController],
  providers: [VotesService, VotesResolver, PrismaService],
  exports: [VotesService],
})
export class VotesModule {}
