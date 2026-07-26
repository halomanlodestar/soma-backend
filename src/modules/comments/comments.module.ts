import { Module } from '@nestjs/common';
import { CommentsService } from './comments.service';
import { CommentsResolver } from './comments.resolver';
import { NotificationsModule } from '../notifications/notifications.module';
import { PrismaService } from '../../prisma/prisma.service';

import { UsersModule } from '../users/users.module';

@Module({
  imports: [NotificationsModule, UsersModule],
  providers: [CommentsService, CommentsResolver, PrismaService],
})
export class CommentsModule {}
