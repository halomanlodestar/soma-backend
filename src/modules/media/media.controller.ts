import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { MediaService } from './media.service';
import { StorageService } from './storage/storage.service';
import {
  UploadIntentDto,
  UploadIntentResponseDto,
} from './dto/create-media.dto';
import { AttachMediaDto } from './dto/update-media.dto';
import { MediaCollection } from './entities/media.entity';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { Express } from 'express';

@ApiTags('Media')
@Controller()
export class MediaController {
  constructor(
    private readonly mediaService: MediaService,
    private readonly storageService: StorageService,
  ) {}

  @Post('media/upload-intent')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('CREATOR', 'ADMIN')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Generate presigned URL for media upload' })
  @ApiResponse({
    status: 201,
    description: 'Presigned upload URL generated',
    type: UploadIntentResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Creator role required',
  })
  async createUploadIntent(
    @CurrentUser() user: Express.User,
    @Body() uploadIntentDto: UploadIntentDto,
  ): Promise<UploadIntentResponseDto> {
    const result = await this.storageService.generatePresignedUploadUrl(
      user.id,
      uploadIntentDto.fileName,
      uploadIntentDto.mimeType,
    );

    return {
      presignedUploadUrl: result.presignedUploadUrl,
      finalPublicUrl: result.finalPublicUrl,
    };
  }

  @Post('posts/:postId/media')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Attach media to a post' })
  @ApiParam({ name: 'postId', description: 'Post UUID', type: String })
  @ApiResponse({
    status: 201,
    description: 'Media attached successfully',
    type: MediaCollection,
  })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Not post author or admin',
  })
  @ApiResponse({ status: 404, description: 'Post not found' })
  async attachMedia(
    @CurrentUser() user: Express.User,
    @Param('postId') postId: string,
    @Body() attachMediaDto: AttachMediaDto,
  ): Promise<MediaCollection> {
    return this.mediaService.attachMediaToPost(
      user.id,
      user.role,
      postId,
      attachMediaDto,
    );
  }

  @Get('posts/:postId/media')
  @ApiOperation({ summary: 'Get media collection for a post' })
  @ApiParam({ name: 'postId', description: 'Post UUID', type: String })
  @ApiResponse({
    status: 200,
    description: 'Media collection found or null if no media attached',
    type: MediaCollection,
  })
  async getMediaByPost(
    @Param('postId') postId: string,
  ): Promise<MediaCollection | null> {
    return this.mediaService.getMediaByPost(postId);
  }
}
