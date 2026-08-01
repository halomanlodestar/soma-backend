import { Module } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CollectionsService } from './collections.service';
import { CollectionsResolver } from './collections.resolver';

@Module({ providers: [CollectionsService, CollectionsResolver, PrismaService] })
export class CollectionsModule {}
