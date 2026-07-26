import { Module } from '@nestjs/common';
import { CommentsService } from './comments.service';
import { CommentsResolver } from './comments.resolver';
import { NotificationsModule } from '../notifications/notifications.module';
import { PrismaService } from '../../prisma/prisma.service';

import { UsersModule } from '../users/users.module';
import { VotesModule } from '../votes/votes.module';

@Module({
  imports: [NotificationsModule, UsersModule, VotesModule],
  providers: [CommentsService, CommentsResolver, PrismaService],
})
export class CommentsModule {}
