import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { PostsService } from './posts.service';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Post as PostEntity } from './entities/post.entity';
import type { Express } from 'express';

@Controller()
export class PostsController {
  constructor(private readonly postsService: PostsService) {}

  @Post('posts')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('CREATOR', 'ADMIN')
  create(
    @CurrentUser() user: Express.User,
    @Body() createPostDto: CreatePostDto,
  ): Promise<PostEntity> {
    return this.postsService.create(user.id, createPostDto);
  }

  @Get('somas/:somaId/posts')
  findBySoma(@Param('somaId') somaId: string): Promise<PostEntity[]> {
    return this.postsService.findBySoma(somaId);
  }

  @Get('posts/:id')
  findOne(@Param('id') id: string): Promise<PostEntity> {
    return this.postsService.findOne(id);
  }

  @Patch('posts/:id')
  @UseGuards(JwtAuthGuard)
  update(
    @CurrentUser() user: Express.User,
    @Param('id') id: string,
    @Body() updatePostDto: UpdatePostDto,
  ): Promise<PostEntity> {
    return this.postsService.update(user.id, user.role, id, updatePostDto);
  }

  @Delete('posts/:id')
  @UseGuards(JwtAuthGuard)
  remove(
    @CurrentUser() user: Express.User,
    @Param('id') id: string,
  ): Promise<PostEntity> {
    return this.postsService.remove(user.id, user.role, id);
  }
}
