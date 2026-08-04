import { SomaResultUnion } from './dto/soma-results.dto';
import { Resolver, Query, Mutation, Args } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { SomaService } from './soma.service';
import { SomaResult } from './types/soma-result.type';
import { CreateSomaDto } from './dto/create-soma.dto';
import { UpdateSomaDto } from './dto/update-soma.dto';
import { Soma as SomaEntity } from './entities/soma.entity';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PlatformRolesGuard } from '../../common/guards/platform-roles.guard';
import { RequirePlatformRoles } from '../../common/decorators/platform-roles.decorator';
import { UserRole } from '../../prisma/generated/client';
import { QueryCacheService } from '../../common/cache/query-cache.service';

@Resolver(() => SomaEntity)
export class SomaResolver {
  constructor(
    private readonly somaService: SomaService,
    private readonly queryCache: QueryCacheService,
  ) {}

  @Mutation(() => SomaResultUnion)
  @UseGuards(JwtAuthGuard, PlatformRolesGuard)
  @RequirePlatformRoles(UserRole.ADMIN)
  async createSoma(
    @Args('data') createSomaDto: CreateSomaDto,
  ): Promise<SomaResult> {
    return this.somaService.create(createSomaDto);
  }

  @Mutation(() => SomaResultUnion)
  @UseGuards(JwtAuthGuard, PlatformRolesGuard)
  @RequirePlatformRoles(UserRole.ADMIN)
  async updateSoma(
    @Args('id') id: string,
    @Args('data') updateSomaDto: UpdateSomaDto,
  ): Promise<SomaResult> {
    return this.somaService.update(id, updateSomaDto);
  }

  @Query(() => [SomaEntity])
  async getAllSomas(): Promise<SomaEntity[]> {
    return this.queryCache.getOrSet('query:somas:all', 300_000, () =>
      this.somaService.findAll(),
    );
  }

  @Query(() => SomaResultUnion)
  async getSomaBySlug(@Args('slug') slug: string): Promise<SomaResult> {
    const normalizedSlug = slug.toLowerCase();

    return this.queryCache.getOrSet(
      `query:soma:slug:${normalizedSlug}`,
      300_000,
      () => this.somaService.findBySlug(normalizedSlug),
    );
  }
}
