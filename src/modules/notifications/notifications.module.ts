import { Module } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { NotificationsResolver } from './notifications.resolver';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationsWorkerController } from './notifications-worker.controller';

@Module({
  controllers: [NotificationsWorkerController],
  providers: [NotificationsService, NotificationsResolver, PrismaService],
  exports: [NotificationsService],
})
export class NotificationsModule {}
