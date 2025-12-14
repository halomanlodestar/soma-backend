import { Test, TestingModule } from '@nestjs/testing';
import { SomaController } from './soma.controller';
import { SomaService } from './soma.service';

describe('SomaController', () => {
  let controller: SomaController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SomaController],
      providers: [SomaService],
    }).compile();

    controller = module.get<SomaController>(SomaController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
