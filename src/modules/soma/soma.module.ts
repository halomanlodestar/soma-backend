import { Module } from '@nestjs/common';
import { SomaService } from './soma.service';
import { SomaResolver } from './soma.resolver';
import { PrismaService } from '../../prisma/prisma.service';

@Module({
  providers: [SomaService, SomaResolver, PrismaService],
})
export class SomaModule {}
