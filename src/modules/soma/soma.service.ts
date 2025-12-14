import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { CreateSomaDto } from './dto/create-soma.dto';
import { PrismaService } from '../../prisma/prisma.service';
import { Soma } from './entities/soma.entity';

@Injectable()
export class SomaService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createSomaDto: CreateSomaDto): Promise<Soma> {
    const { name, slug, description } = createSomaDto;

    const existing = await this.prisma.soma.findUnique({
      where: { slug },
    });

    if (existing) {
      throw new ConflictException(`Soma with slug '${slug}' already exists`);
    }

    return this.prisma.soma.create({
      data: {
        name,
        slug: slug.toLowerCase(),
        description,
      },
    });
  }

  async findAll(): Promise<Soma[]> {
    return this.prisma.soma.findMany({
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findBySlug(slug: string): Promise<Soma> {
    const soma = await this.prisma.soma.findUnique({
      where: { slug: slug.toLowerCase() },
    });

    if (!soma) {
      throw new NotFoundException(`Soma with slug '${slug}' not found`);
    }

    return soma;
  }
}
