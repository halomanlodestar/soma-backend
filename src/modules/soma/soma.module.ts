import { Module } from '@nestjs/common';
import { SomaService } from './soma.service';
import { SomaController } from './soma.controller';
import { PrismaService } from '../../prisma/prisma.service';

@Module({
  controllers: [SomaController],
  providers: [SomaService, PrismaService],
  exports: [SomaService],
})
export class SomaModule {}
