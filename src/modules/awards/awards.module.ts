import { Module } from '@nestjs/common';
import { AwardsService } from './awards.service';
import { AwardsResolver } from './awards.resolver';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [NotificationsModule],
  providers: [AwardsService, AwardsResolver, PrismaService],
})
export class AwardsModule {}
