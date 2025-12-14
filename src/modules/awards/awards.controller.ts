import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { AwardsService } from './awards.service';
import { CreateAwardDto } from './dto/create-award.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { Award as AwardEntity } from './entities/award.entity';
import type { Express } from 'express';

@ApiTags('Awards')
@Controller()
export class AwardsController {
  constructor(private readonly awardsService: AwardsService) {}

  @Post('awards')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Give an award to a post or comment' })
  @ApiResponse({
    status: 201,
    description: 'Award created successfully',
    type: AwardEntity,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid input or target not found',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  create(
    @CurrentUser() user: Express.User,
    @Body() createAwardDto: CreateAwardDto,
  ) {
    return this.awardsService.create(user.id, createAwardDto);
  }

  @Get('posts/:postId/awards')
  @ApiOperation({ summary: 'Get all awards for a post' })
  @ApiParam({ name: 'postId', description: 'Post UUID' })
  @ApiResponse({
    status: 200,
    description: 'List of awards',
    type: [AwardEntity],
  })
  findAllByPost(@Param('postId') postId: string) {
    return this.awardsService.findAllByPost(postId);
  }

  @Get('comments/:commentId/awards')
  @ApiOperation({ summary: 'Get all awards for a comment' })
  @ApiParam({ name: 'commentId', description: 'Comment UUID' })
  @ApiResponse({
    status: 200,
    description: 'List of awards',
    type: [AwardEntity],
  })
  findAllByComment(@Param('commentId') commentId: string) {
    return this.awardsService.findAllByComment(commentId);
  }
}
