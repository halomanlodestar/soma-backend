import { Injectable } from '@nestjs/common';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { PrismaService } from '../../prisma/prisma.service';
import { Post } from './entities/post.entity';

import { ClientProxy } from '@nestjs/microservices';
import { Inject } from '@nestjs/common';
import {
  NotFoundError,
  UnauthorizedError,
  InvalidInputError,
  BaseError,
} from '../../common/errors/graphql-errors';

export type PostResult =
  | Post
  | NotFoundError
  | UnauthorizedError
  | InvalidInputError;

@Injectable()
export class PostsService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject('RMQ_CLIENT') private readonly client: ClientProxy,
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

    const hasMedia = media && media.length > 0;

    const post = await this.prisma.post.create({
      data: {
        title,
        body,
        authorId: userId,
        somaId,
        visibility: hasMedia ? 'WAITING' : 'PUBLIC',
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
        visibility: { in: ['PUBLIC', 'SUBSCRIBER_ONLY'] },
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
        visibility: { in: ['PUBLIC', 'SUBSCRIBER_ONLY'] },
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
        visibility: { in: ['PUBLIC', 'SUBSCRIBER_ONLY'] },
      },
      orderBy: {
        hotScore: 'desc',
      },
    });

    return posts;
  }

  async findOne(id: string): Promise<PostResult> {
    const post = await this.prisma.post.findFirst({
      where: { id, visibility: { in: ['PUBLIC', 'SUBSCRIBER_ONLY'] } },
    });

    if (!post) {
      return new NotFoundError(`Post with id '${id}' not found`);
    }

    return post;
  }

  async update(
    userId: string,
    userRole: string,
    postId: string,
    updatePostDto: UpdatePostDto,
  ): Promise<PostResult> {
    const postResult = await this.findOne(postId);

    if (postResult instanceof BaseError) {
      return postResult;
    }

    if (postResult.authorId !== userId && userRole !== 'ADMIN') {
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
    const postResult = await this.findOne(postId);

    if (postResult instanceof BaseError) {
      return postResult;
    }

    if (postResult.authorId !== userId && userRole !== 'ADMIN') {
      return new UnauthorizedError('You are not allowed to delete this post.');
    }

    const updatedPost = await this.prisma.post.update({
      where: { id: postId },
      data: { visibility: 'DELETING' },
    });

    this.client.emit('post.delete', { postId });

    return updatedPost;
  }
}
