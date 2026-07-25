import { Module } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { join } from 'path';
import { BullModule } from '@nestjs/bullmq';
import { ConfigService } from '@nestjs/config';
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

@Module({
  imports: [
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      autoSchemaFile: join(process.cwd(), 'src/schema.gql'),
      sortSchema: true,
      playground: true,
      includeStacktraceInErrorResponses: false,
      formatError: (error) => {
        const originalError = error.extensions?.originalError as
          | Record<string, unknown>
          | undefined;

        if (!originalError) {
          return {
            message: error.message,
            code: error.extensions?.code || 'INTERNAL_SERVER_ERROR',
          };
        }
        return {
          message: (originalError.message as string) || error.message,
          code: (originalError.error as string) || error.extensions?.code,
          statusCode: originalError.statusCode as number | undefined,
        };
      },
    }),
    BullModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        connection: {
          host: config.get<string>('REDIS_HOST'),
          port: config.get<number>('REDIS_PORT'),
        },
      }),
    }),
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
  ],
  providers: [PrismaService],
})
export class AppModule {}
