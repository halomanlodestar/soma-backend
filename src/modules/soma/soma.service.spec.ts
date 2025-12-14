import { Test, TestingModule } from '@nestjs/testing';
import { SomaService } from './soma.service';

describe('SomaService', () => {
  let service: SomaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SomaService],
    }).compile();

    service = module.get<SomaService>(SomaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
