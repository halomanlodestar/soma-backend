import { Module } from '@nestjs/common';
import { UsersModule } from './users/users.module';
import { PostsModule } from './posts/posts.module';
import { SomaModule } from './soma/soma.module';

@Module({
  imports: [UsersModule, PostsModule, SomaModule],
})
export class AppModule {}
