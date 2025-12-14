import { Module } from '@nestjs/common';
import { SomaService } from './soma.service';
import { SomaController } from './soma.controller';

@Module({
  controllers: [SomaController],
  providers: [SomaService],
})
export class SomaModule {}
