import { Module } from '@nestjs/common';
import { UsersModule } from './modules/users/users.module';
import { PostsModule } from './modules/posts/posts.module';
import { SomaModule } from './modules/soma/soma.module';
import { AuthModule } from './modules/auth/auth.module';
import { CommentsModule } from './modules/comments/comments.module';
import { VotesModule } from './modules/votes/votes.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { PrismaService } from './prisma/prisma.service';
import { ConfigModule } from './config/config.module';
import { MediaModule } from './modules/media/media.module';
import { AwardsModule } from './modules/awards/awards.module';

@Module({
  imports: [
    UsersModule,
    PostsModule,
    SomaModule,
    AuthModule,
    CommentsModule,
    VotesModule,
    NotificationsModule,
    ConfigModule,
    MediaModule,
    AwardsModule,
  ],
  providers: [PrismaService],
})
export class AppModule {}
