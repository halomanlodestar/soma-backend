import { Test, TestingModule } from '@nestjs/testing';
import { AwardsService } from './awards.service';
import { PrismaService } from '../../prisma/prisma.service';

describe('AwardsService', () => {
  let service: AwardsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AwardsService,
        { provide: PrismaService, useValue: {} },
        { provide: 'COMMANDS_RMQ_CLIENT', useValue: {} },
        { provide: 'NOTIFICATIONS_RMQ_CLIENT', useValue: {} },
      ],
    }).compile();

    service = module.get<AwardsService>(AwardsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
