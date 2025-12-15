import {
  Controller,
  Post,
  Delete,
  Get,
  Param,
  UseGuards,
  ParseUUIDPipe,
  Req,
  UnauthorizedException,
} from '@nestjs/common';
import { FollowService } from './follow.service';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import type { Request } from 'express';

@ApiTags('Follow')
@Controller()
export class FollowController {
  constructor(private readonly followService: FollowService) {}

  @Post('follow/:userId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Follow a creator' })
  @ApiParam({
    name: 'userId',
    type: 'string',
    description: 'ID of the creator to follow',
  })
  async follow(
    @Req() req: Request,
    @Param('userId', ParseUUIDPipe) followingId: string,
  ) {
    if (!req.user) {
      throw new UnauthorizedException('User not authenticated');
    }

    const followerId = req.user.id;
    return this.followService.follow(followerId, followingId);
  }

  @Delete('follow/:userId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Unfollow a creator' })
  @ApiParam({
    name: 'userId',
    type: 'string',
    description: 'ID of the creator to unfollow',
  })
  async unfollow(
    @Req() req: Request,
    @Param('userId', ParseUUIDPipe) followingId: string,
  ) {
    if (!req.user) {
      throw new UnauthorizedException('User not authenticated');
    }

    const followerId = req.user.id;
    return this.followService.unfollow(followerId, followingId);
  }

  @Get('users/:userId/followers')
  @ApiOperation({ summary: 'Get list of users following the creator' })
  async getFollowers(@Param('userId', ParseUUIDPipe) userId: string) {
    return this.followService.getFollowers(userId);
  }

  @Get('users/:userId/following')
  @ApiOperation({ summary: 'Get list of creators this user follows' })
  async getFollowing(@Param('userId', ParseUUIDPipe) userId: string) {
    return this.followService.getFollowing(userId);
  }

  @Get('users/:userId/follow-status')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Check if current user follows the creator' })
  async getFollowStatus(
    @Req() req: Request,
    @Param('userId', ParseUUIDPipe) followingId: string,
  ) {
    if (!req.user) {
      throw new UnauthorizedException('User not authenticated');
    }

    const followerId = req.user.id;
    return this.followService.getFollowStatus(followerId, followingId);
  }
}
