import { Module } from '@nestjs/common';
import { AwardsService } from './awards.service';
import { AwardsResolver } from './awards.resolver';
import { PrismaService } from '../../prisma/prisma.service';
import { AwardsWorkerController } from './awards-worker.controller';

@Module({
  controllers: [AwardsWorkerController],
  providers: [AwardsService, AwardsResolver, PrismaService],
})
export class AwardsModule {}
