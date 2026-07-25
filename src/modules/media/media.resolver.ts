import { Resolver, Query, Mutation, Args } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { MediaService } from './media.service';
import { StorageService } from './storage/storage.service';
import {
  UploadIntentDto,
  UploadIntentResponseDto,
} from './dto/create-media.dto';
import { MediaCollection } from './entities/media.entity';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { Express } from 'express';

@Resolver(() => MediaCollection)
export class MediaResolver {
  constructor(
    private readonly mediaService: MediaService,
    private readonly storageService: StorageService,
  ) {}

  @Mutation(() => UploadIntentResponseDto)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('CREATOR', 'ADMIN')
  async createUploadIntent(
    @CurrentUser() user: Express.User,
    @Args('data') uploadIntentDto: UploadIntentDto,
  ): Promise<UploadIntentResponseDto> {
    const result = await this.storageService.generatePresignedUploadUrl(
      user.id,
      uploadIntentDto.fileName,
      uploadIntentDto.mimeType,
    );

    return {
      presignedUploadUrl: result.presignedUploadUrl,
      finalPublicUrl: result.finalPublicUrl,
      key: result.key,
    };
  }

  @Query(() => MediaCollection, { nullable: true })
  async getMediaByPost(
    @Args('postId') postId: string,
  ): Promise<MediaCollection | null> {
    return this.mediaService.getMediaByPost(postId);
  }
}
