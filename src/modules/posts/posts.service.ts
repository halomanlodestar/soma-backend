import { Injectable } from '@nestjs/common';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { PrismaService } from '../../prisma/prisma.service';
import { SomaMembershipsService } from '../soma-memberships/soma-memberships.service';
import { PostVisibility } from '../../prisma/generated/client';

import { ClientProxy } from '@nestjs/microservices';
import { Inject } from '@nestjs/common';
import {
  NotFoundError,
  UnauthorizedError,
  InvalidInputError,
} from '../../common/errors/graphql-errors';
import { PostResult } from './types/post-result.type';
import { Post } from './entities/post.entity';

@Injectable()
export class PostsService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject('RMQ_CLIENT') private readonly client: ClientProxy,
    private readonly membershipsService: SomaMembershipsService,
  ) {}

  async create(
    userId: string,
    createPostDto: CreatePostDto,
  ): Promise<PostResult> {
    const { title, body, somaId, media } = createPostDto;

    const soma = await this.prisma.soma.findUnique({
      where: { id: somaId },
    });

    if (!soma) {
      return new InvalidInputError(`Soma with id '${somaId}' does not exist`);
    }

    const membership =
      await this.membershipsService.getActivePublishingMembership(
        userId,
        somaId,
      );

    if (!membership) {
      return new UnauthorizedError(
        'You need an active creator membership in this Soma to create work.',
      );
    }

    const hasMedia = media && media.length > 0;
    const assetIds = media?.map((item) => item.assetId) ?? [];

    let assets: {
      id: string;
    }[] = [];

    if (assetIds.length) {
      assets = await this.prisma.mediaAsset.findMany({
        where: {
          id: { in: assetIds },
          ownerId: userId,
          purpose: 'POST_MEDIA',
          status: 'UPLOAD_PENDING',
        },
        select: { id: true },
      });
    }

    if (
      assets.length !== assetIds.length ||
      new Set(assetIds).size !== assetIds.length
    ) {
      return new InvalidInputError(
        'Every media item must be a distinct pending post-media asset owned by you.',
      );
    }

    const post = await this.prisma.post.create({
      data: {
        title,
        body,
        authorId: userId,
        somaId,
        creatorMembershipId: membership.id,
        visibility: 'DRAFT',
        mediaStatus: hasMedia ? 'PENDING' : 'READY',
      },
    });

    this.client.emit('post.process_media', {
      postId: post.id,
      assetIds,
    });

    return post;
  }

  async findBySoma(somaId: string): Promise<Post[]> {
    return this.prisma.post.findMany({
      where: {
        somaId,
        visibility: 'PUBLISHED',
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findByUser(userId: string): Promise<Post[]> {
    return this.prisma.post.findMany({
      where: {
        authorId: userId,
        visibility: 'PUBLISHED',
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findTopPosts(page = 1, limit = 20): Promise<Post[]> {
    const skip = (page - 1) * limit;

    const posts = await this.prisma.post.findMany({
      take: limit,
      skip,
      where: {
        visibility: 'PUBLISHED',
      },
      orderBy: {
        hotScore: 'desc',
      },
    });

    return posts;
  }

  async findOne(id: string): Promise<PostResult> {
    const post = await this.prisma.post.findFirst({
      where: { id, visibility: 'PUBLISHED' },
    });

    if (!post) {
      return new NotFoundError(`Post with id '${id}' not found`);
    }

    return post;
  }

  async findStudioPosts(
    userId: string,
    statuses?: PostVisibility[],
  ): Promise<Post[]> {
    return this.prisma.post.findMany({
      where: {
        authorId: userId,
        ...(statuses?.length ? { visibility: { in: statuses } } : {}),
      },
      orderBy: { updatedAt: 'desc' },
    });
  }

  async findStudioPost(userId: string, id: string): Promise<PostResult> {
    const post = await this.prisma.post.findUnique({ where: { id } });

    if (!post) return new NotFoundError(`Post with id '${id}' not found`);

    if (post.authorId !== userId)
      return new UnauthorizedError('You cannot view this studio post.');

    return post;
  }

  async update(
    userId: string,
    userRole: string,
    postId: string,
    updatePostDto: UpdatePostDto,
  ): Promise<PostResult> {
    const post = await this.prisma.post.findUnique({ where: { id: postId } });
    if (!post) return new NotFoundError(`Post with id '${postId}' not found`);

    if (post.authorId !== userId && userRole !== 'ADMIN') {
      return new UnauthorizedError('You are not allowed to update this post.');
    }

    return this.prisma.post.update({
      where: { id: postId },
      data: updatePostDto,
    });
  }

  async delete(
    userId: string,
    userRole: string,
    postId: string,
  ): Promise<PostResult> {
    const post = await this.prisma.post.findUnique({ where: { id: postId } });
    if (!post) return new NotFoundError(`Post with id '${postId}' not found`);

    if (post.authorId !== userId && userRole !== 'ADMIN') {
      return new UnauthorizedError('You are not allowed to delete this post.');
    }

    const updatedPost = await this.prisma.post.update({
      where: { id: postId },
      data: { visibility: 'ARCHIVED' },
    });

    this.client.emit('post.delete', { postId });

    return updatedPost;
  }
}
