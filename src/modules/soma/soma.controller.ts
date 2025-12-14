import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { SomaService } from './soma.service';
import { CreateSomaDto } from './dto/create-soma.dto';
import { UpdateSomaDto } from './dto/update-soma.dto';

@Controller('soma')
export class SomaController {
  constructor(private readonly somaService: SomaService) {}

  @Post()
  create(@Body() createSomaDto: CreateSomaDto) {
    return this.somaService.create(createSomaDto);
  }

  @Get()
  findAll() {
    return this.somaService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.somaService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateSomaDto: UpdateSomaDto) {
    return this.somaService.update(+id, updateSomaDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.somaService.remove(+id);
  }
}
