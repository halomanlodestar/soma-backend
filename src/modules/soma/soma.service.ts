import { Injectable } from '@nestjs/common';
import { CreateSomaDto } from './dto/create-soma.dto';
import { UpdateSomaDto } from './dto/update-soma.dto';

@Injectable()
export class SomaService {
  create(createSomaDto: CreateSomaDto) {
    return 'This action adds a new soma';
  }

  findAll() {
    return `This action returns all soma`;
  }

  findOne(id: number) {
    return `This action returns a #${id} soma`;
  }

  update(id: number, updateSomaDto: UpdateSomaDto) {
    return `This action updates a #${id} soma`;
  }

  remove(id: number) {
    return `This action removes a #${id} soma`;
  }
}
