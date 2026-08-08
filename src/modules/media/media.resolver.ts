import { Resolver, Query, Mutation, Args } from '@nestjs/graphql';
import { ForbiddenException, UseGuards } from '@nestjs/common';
import { MediaService } from './media.service';
import {
  UploadIntentDto,
  UploadIntentResponseDto,
} from './dto/create-media.dto';
import { validateUploadIntent } from './types/media-upload-policy.types';
import { MediaCollection } from './entities/media.entity';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { Express } from 'express';
import { SomaMembershipsService } from '../soma-memberships/soma-memberships.service';

@Resolver(() => MediaCollection)
export class MediaResolver {
  constructor(
    private readonly mediaService: MediaService,
    private readonly membershipsService: SomaMembershipsService,
  ) {}

  @Mutation(() => UploadIntentResponseDto)
  @UseGuards(JwtAuthGuard)
  async createUploadIntent(
    @CurrentUser() user: Express.User,
    @Args('data') uploadIntentDto: UploadIntentDto,
  ): Promise<UploadIntentResponseDto> {
    const policy = validateUploadIntent(uploadIntentDto);

    if (policy.requiresSomaMembership) {
      const membership =
        await this.membershipsService.getActivePublishingMembership(
          user.id,
          uploadIntentDto.somaId!,
        );

      if (!membership) {
        throw new ForbiddenException(
          'An active creator membership in this Soma is required to upload media.',
        );
      }
    }

    const result = await this.mediaService.createUploadIntent({
      userId: user.id,
      purpose: uploadIntentDto.purpose,
      mediaType: uploadIntentDto.mediaType,
      fileName: uploadIntentDto.fileName,
      mimeType: uploadIntentDto.mimeType,
      byteSize: uploadIntentDto.byteSize,
    });

    return {
      assetId: result.assetId,
      presignedUploadUrl: result.presignedUploadUrl,
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
