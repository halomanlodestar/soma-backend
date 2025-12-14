import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { PostsService } from './posts.service';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Post as PostEntity } from './entities/post.entity';
import type { Express } from 'express';

@ApiTags('Posts')
@Controller()
export class PostsController {
  constructor(private readonly postsService: PostsService) {}

  @Post('posts')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('CREATOR', 'ADMIN')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Create a new post' })
  @ApiResponse({
    status: 201,
    description: 'Post created successfully',
    type: PostEntity,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid input or soma does not exist',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Creator role required',
  })
  create(
    @CurrentUser() user: Express.User,
    @Body() createPostDto: CreatePostDto,
  ): Promise<PostEntity> {
    return this.postsService.create(user.id, createPostDto);
  }

  @Get('posts')
  @ApiOperation({ summary: 'Get top posts sorted by votes' })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Page number',
    example: 1,
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Number of posts per page',
    example: 20,
  })
  @ApiResponse({
    status: 200,
    description: 'List of top posts',
    type: [PostEntity],
  })
  findTopPosts(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ): Promise<PostEntity[]> {
    const pageNum = page ? parseInt(page, 10) : 1;
    const limitNum = limit ? parseInt(limit, 10) : 20;
    return this.postsService.findTopPosts(pageNum, limitNum);
  }

  @Get('somas/:somaId/posts')
  @ApiOperation({ summary: 'Get all posts in a soma' })
  @ApiParam({ name: 'somaId', description: 'Soma UUID', type: String })
  @ApiResponse({
    status: 200,
    description: 'List of posts in the soma',
    type: [PostEntity],
  })
  findBySoma(@Param('somaId') somaId: string): Promise<PostEntity[]> {
    return this.postsService.findBySoma(somaId);
  }

  @Get('posts/:id')
  @ApiOperation({ summary: 'Get post by ID' })
  @ApiParam({ name: 'id', description: 'Post UUID', type: String })
  @ApiResponse({
    status: 200,
    description: 'Post found',
    type: PostEntity,
  })
  @ApiResponse({ status: 404, description: 'Post not found' })
  findOne(@Param('id') id: string): Promise<PostEntity> {
    return this.postsService.findOne(id);
  }

  @Patch('posts/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Update post' })
  @ApiParam({ name: 'id', description: 'Post UUID', type: String })
  @ApiResponse({
    status: 200,
    description: 'Post updated successfully',
    type: PostEntity,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Not post author or admin',
  })
  @ApiResponse({ status: 404, description: 'Post not found' })
  update(
    @CurrentUser() user: Express.User,
    @Param('id') id: string,
    @Body() updatePostDto: UpdatePostDto,
  ): Promise<PostEntity> {
    return this.postsService.update(user.id, user.role, id, updatePostDto);
  }

  @Delete('posts/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Delete post' })
  @ApiParam({ name: 'id', description: 'Post UUID', type: String })
  @ApiResponse({
    status: 200,
    description: 'Post deleted successfully',
    type: PostEntity,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Not post author or admin',
  })
  @ApiResponse({ status: 404, description: 'Post not found' })
  remove(
    @CurrentUser() user: Express.User,
    @Param('id') id: string,
  ): Promise<PostEntity> {
    return this.postsService.remove(user.id, user.role, id);
  }
}
