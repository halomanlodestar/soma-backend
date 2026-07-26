import { SomaResult } from './types/soma-result.type';
import { Injectable } from '@nestjs/common';
import { CreateSomaDto } from './dto/create-soma.dto';
import { UpdateSomaDto } from './dto/update-soma.dto';
import { PrismaService } from '../../prisma/prisma.service';
import { Soma } from './entities/soma.entity';
import {
  NotFoundError,
  InvalidInputError,
} from '../../common/errors/graphql-errors';

@Injectable()
export class SomaService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createSomaDto: CreateSomaDto): Promise<SomaResult> {
    const { name, slug, description } = createSomaDto;

    const existing = await this.prisma.soma.findUnique({
      where: { slug },
    });

    if (existing) {
      return new InvalidInputError(`Soma with slug '${slug}' already exists`);
    }

    return this.prisma.soma.create({
      data: {
        name,
        slug: slug.toLowerCase(),
        description,
      },
    });
  }

  async update(id: string, updateSomaDto: UpdateSomaDto): Promise<SomaResult> {
    try {
      const soma = await this.prisma.soma.update({
        where: { id },
        data: updateSomaDto,
      });
      return soma;
    } catch {
      return new NotFoundError(`Soma with id '${id}' not found`);
    }
  }

  async findAll(): Promise<Soma[]> {
    return this.prisma.soma.findMany({
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findBySlug(slug: string): Promise<SomaResult> {
    const soma = await this.prisma.soma.findUnique({
      where: { slug: slug.toLowerCase() },
    });

    if (!soma) {
      return new NotFoundError(`Soma with slug '${slug}' not found`);
    }

    return soma;
  }

  async findById(id: string): Promise<SomaResult> {
    const soma = await this.prisma.soma.findUnique({
      where: { id },
    });

    if (!soma) {
      return new NotFoundError(`Soma with id '${id}' not found`);
    }

    return soma;
  }
}
