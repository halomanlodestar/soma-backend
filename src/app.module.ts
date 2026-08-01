import { join } from 'path';
import { Module } from '@nestjs/common';
import { RedisModule } from '@nestjs-modules/ioredis';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { RabbitMQModule } from './modules/rabbitmq/rabbitmq.module';
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
import { FeedModule } from './modules/feed/feed.module';
import { FollowModule } from './modules/follow/follow.module';
import { SomaMembershipsModule } from './modules/soma-memberships/soma-memberships.module';
import { CollectionsModule } from './modules/collections/collections.module';
import { LoggingPlugin } from './common/plugins/logging.plugin';
import { formatError } from './common/utils/format';
import { ConfigService } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerModule } from '@nestjs/throttler';

@Module({
  imports: [
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      autoSchemaFile: join(process.cwd(), 'src/schema.gql'),
      sortSchema: true,
      playground: true,
      includeStacktraceInErrorResponses: false,
      formatError,
    }),
    ScheduleModule.forRoot(),
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 100 }]),
    RedisModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'single',
        url: `redis://${configService.get<string>('REDIS_HOST')}:${configService.get<string>('REDIS_PORT')}`,
      }),
    }),
    RabbitMQModule,
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
    FeedModule,
    FollowModule,
    SomaMembershipsModule,
    CollectionsModule,
  ],
  providers: [PrismaService, LoggingPlugin],
})
export class AppModule {}
