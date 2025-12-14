import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { SomaService } from './soma.service';
import { CreateSomaDto } from './dto/create-soma.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Soma } from './entities/soma.entity';

@Controller('somas')
export class SomaController {
  constructor(private readonly somaService: SomaService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  create(@Body() createSomaDto: CreateSomaDto): Promise<Soma> {
    return this.somaService.create(createSomaDto);
  }

  @Get()
  findAll(): Promise<Soma[]> {
    return this.somaService.findAll();
  }

  @Get(':slug')
  findBySlug(@Param('slug') slug: string): Promise<Soma> {
    return this.somaService.findBySlug(slug);
  }
}
