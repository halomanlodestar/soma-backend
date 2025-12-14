import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from './generated/client';

@Injectable()
export class PrismaService extends PrismaClient {
  constructor(configService: ConfigService) {
    const adapter = new PrismaPg({
      url: configService.get<string>('database.url'),
    });
    super({ adapter });
  }
}
