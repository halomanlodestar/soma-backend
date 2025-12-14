import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { SomaService } from './soma.service';
import { CreateSomaDto } from './dto/create-soma.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Soma } from './entities/soma.entity';

@ApiTags('Somas')
@Controller('somas')
export class SomaController {
  constructor(private readonly somaService: SomaService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Create a new soma (community)' })
  @ApiResponse({
    status: 201,
    description: 'Soma created successfully',
    type: Soma,
  })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin role required' })
  @ApiResponse({
    status: 409,
    description: 'Soma with this slug already exists',
  })
  create(@Body() createSomaDto: CreateSomaDto): Promise<Soma> {
    return this.somaService.create(createSomaDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all somas' })
  @ApiResponse({
    status: 200,
    description: 'List of all somas',
    type: [Soma],
  })
  findAll(): Promise<Soma[]> {
    return this.somaService.findAll();
  }

  @Get(':slug')
  @ApiOperation({ summary: 'Get soma by slug' })
  @ApiParam({ name: 'slug', description: 'Soma slug', example: 'tech-news' })
  @ApiResponse({
    status: 200,
    description: 'Soma found',
    type: Soma,
  })
  @ApiResponse({ status: 404, description: 'Soma not found' })
  findBySlug(@Param('slug') slug: string): Promise<Soma> {
    return this.somaService.findBySlug(slug);
  }
}
