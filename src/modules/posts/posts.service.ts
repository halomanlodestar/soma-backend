import { Injectable } from '@nestjs/common';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { PrismaService } from '../../prisma/prisma.service';
import { SomaMembershipsService } from '../soma-memberships/soma-memberships.service';
import { PostVisibility } from '../../prisma/generated/client';
import { StorageService } from '../media/storage/storage.service';

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
    private readonly storageService: StorageService,
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
    if (
      media?.some(
        (item) => !this.storageService.isOwnedStagingKey(userId, item.key),
      )
    ) {
      return new InvalidInputError(
        'Every media item must be uploaded by the post author.',
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

    if (hasMedia) {
      this.client.emit('post.process_media', {
        postId: post.id,
        media,
      });
    }

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

  async submit(userId: string, postId: string): Promise<PostResult> {
    const post = await this.prisma.post.findUnique({ where: { id: postId } });
    if (!post) return new NotFoundError(`Post with id '${postId}' not found`);
    if (post.authorId !== userId) {
      return new UnauthorizedError('You can only submit your own work.');
    }
    if (!['DRAFT', 'NEEDS_CHANGES'].includes(post.visibility)) {
      return new InvalidInputError(
        'Only drafts or work needing changes can be submitted.',
      );
    }
    if (post.mediaStatus !== 'READY') {
      return new InvalidInputError(
        'Wait for all media to finish processing before submitting.',
      );
    }

    const membership =
      await this.membershipsService.getActivePublishingMembership(
        userId,
        post.somaId,
      );
    if (!membership) {
      return new UnauthorizedError(
        'You no longer have an active creator membership in this Soma.',
      );
    }

    const updatedPost = await this.prisma.post.update({
      where: { id: postId },
      data: { visibility: 'APPROVED', creatorMembershipId: membership.id },
    });
    this.client.emit('post.publish', { postId });
    return updatedPost;
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
