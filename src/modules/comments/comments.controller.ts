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
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { CommentsService } from './comments.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Comment as CommentEntity } from './entities/comment.entity';
import type { Express } from 'express';

@ApiTags('Comments')
@Controller()
export class CommentsController {
  constructor(private readonly commentsService: CommentsService) {}

  @Post('posts/:postId/comments')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Create a top-level comment on a post' })
  @ApiParam({ name: 'postId', description: 'Post UUID' })
  @ApiResponse({
    status: 201,
    description: 'Comment created successfully',
    type: CommentEntity,
  })
  @ApiResponse({ status: 400, description: 'Invalid input or post not found' })
  create(
    @CurrentUser() user: Express.User,
    @Param('postId') postId: string,
    @Body() createCommentDto: CreateCommentDto,
  ) {
    return this.commentsService.create(user.id, postId, createCommentDto);
  }

  @Post('comments/:commentId/replies')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Reply to an existing comment' })
  @ApiParam({ name: 'commentId', description: 'Parent Comment UUID' })
  @ApiResponse({
    status: 201,
    description: 'Reply created successfully',
    type: CommentEntity,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid input or parent comment not found',
  })
  reply(
    @CurrentUser() user: Express.User,
    @Param('commentId') commentId: string,
    @Body() createCommentDto: CreateCommentDto,
  ) {
    return this.commentsService.reply(user.id, commentId, createCommentDto);
  }

  @Get('posts/:postId/comments')
  @ApiOperation({
    summary: 'Get all comments for a post (flat list, sorted by creation)',
  })
  @ApiParam({ name: 'postId', description: 'Post UUID' })
  @ApiResponse({
    status: 200,
    description: 'List of comments',
    type: [CommentEntity],
  })
  findAll(@Param('postId') postId: string) {
    return this.commentsService.findAllByPost(postId);
  }

  /**
   * Note: The following endpoints use global /comments prefix if needed,
   * but we defined @Controller() empty so we specifying full paths is cleaner
   * to match the requirement style.
   */
  @Patch('comments/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Update comment content' })
  @ApiParam({ name: 'id', description: 'Comment UUID' })
  @ApiResponse({
    status: 200,
    description: 'Comment updated successfully',
    type: CommentEntity,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Not comment author or admin',
  })
  @ApiResponse({ status: 404, description: 'Comment not found' })
  update(
    @CurrentUser() user: Express.User,
    @Param('id') id: string,
    @Body() updateCommentDto: UpdateCommentDto,
  ) {
    return this.commentsService.update(
      user.id,
      user.role,
      id,
      updateCommentDto,
    );
  }

  @Delete('comments/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Delete comment' })
  @ApiParam({ name: 'id', description: 'Comment UUID' })
  @ApiResponse({
    status: 200,
    description: 'Comment deleted successfully',
    type: CommentEntity,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Not comment author or admin',
  })
  @ApiResponse({ status: 404, description: 'Comment not found' })
  remove(@CurrentUser() user: Express.User, @Param('id') id: string) {
    return this.commentsService.remove(user.id, user.role, id);
  }
}
