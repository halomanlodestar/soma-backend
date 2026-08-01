import { Module } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { SomaMembershipsResolver } from './soma-memberships.resolver';
import { SomaMembershipsService } from './soma-memberships.service';

@Module({
  providers: [SomaMembershipsService, SomaMembershipsResolver, PrismaService],
  exports: [SomaMembershipsService],
})
export class SomaMembershipsModule {}
