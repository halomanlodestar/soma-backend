import { SomaResultUnion } from './dto/soma-results.dto';
import { Resolver, Query, Mutation, Args } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { SomaService, SomaResult } from './soma.service';
import { CreateSomaDto } from './dto/create-soma.dto';
import { Soma as SomaEntity } from './entities/soma.entity';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@Resolver(() => SomaEntity)
export class SomaResolver {
  constructor(private readonly somaService: SomaService) {}

  @Mutation(() => SomaResultUnion)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  async createSoma(
    @Args('data') createSomaDto: CreateSomaDto,
  ): Promise<SomaResult> {
    return this.somaService.create(createSomaDto);
  }

  @Query(() => [SomaEntity])
  async getAllSomas(): Promise<SomaEntity[]> {
    return this.somaService.findAll();
  }

  @Query(() => SomaResultUnion)
  async getSomaBySlug(@Args('slug') slug: string): Promise<SomaResult> {
    return this.somaService.findBySlug(slug);
  }
}
