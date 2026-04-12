import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { PrismaService } from '../../prisma/prisma.service';
import { Post } from './entities/post.entity';
import { Prisma } from '../../prisma/generated/client';
import { Queue } from 'bullmq';
import { InjectQueue } from '@nestjs/bullmq';
import { CreatePostJob } from './jobs/create.job';
import { DeletePostJob } from './jobs/delete.job';

@Injectable()
export class PostsService {
  constructor(
    private readonly prisma: PrismaService,
    @InjectQueue('post-processing')
    private readonly postProcessingQueue: Queue<CreatePostJob>,
    @InjectQueue('post-deletion')
    private readonly postDeletionQueue: Queue<DeletePostJob>,
  ) {}

  async create(userId: string, createPostDto: CreatePostDto): Promise<Post> {
    const { title, body, somaId, media } = createPostDto;

    const soma = await this.prisma.soma.findUnique({
      where: { id: somaId },
    });

    if (!soma) {
      throw new BadRequestException(`Soma with id '${somaId}' does not exist`);
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
      await this.postProcessingQueue.add('process-post-media', {
        postId: post.id,
        media,
      } satisfies CreatePostJob);
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

  async findTopPosts(page = 1, limit = 20): Promise<Post[]> {
    const skip = (page - 1) * limit;

    const includeVoteValue = {
      votes: { select: { value: true } },
    } satisfies Prisma.PostInclude;

    type PostWithVotes = Prisma.PostGetPayload<{
      include: typeof includeVoteValue;
    }>;

    const posts: PostWithVotes[] = await this.prisma.post.findMany({
      take: limit,
      skip,
      where: {
        visibility: { in: ['PUBLIC', 'SUBSCRIBER_ONLY'] },
      },
      include: includeVoteValue,
      orderBy: {
        createdAt: 'desc',
      },
    });

    const postsWithScores = posts.map((post: PostWithVotes) => {
      const score = post.votes.reduce(
        (sum: number, vote: { value: number }) => sum + vote.value,
        0,
      );
      return { ...post, score };
    });

    postsWithScores.sort((a, b) => {
      if (b.score !== a.score) {
        return b.score - a.score;
      }
      return b.createdAt.getTime() - a.createdAt.getTime();
    });

    return postsWithScores.map(
      (post): Post => ({
        id: post.id,
        title: post.title,
        body: post.body,
        authorId: post.authorId,
        somaId: post.somaId,
        impressions: post.impressions,
        createdAt: post.createdAt,
        updatedAt: post.updatedAt,
      }),
    );
  }

  async findOne(id: string): Promise<Post> {
    const post = await this.prisma.post.findFirst({
      where: { id, visibility: { in: ['PUBLIC', 'SUBSCRIBER_ONLY'] } },
    });

    if (!post) {
      throw new NotFoundException(`Post with id '${id}' not found`);
    }

    return post;
  }

  async update(
    userId: string,
    userRole: string,
    postId: string,
    updatePostDto: UpdatePostDto,
  ): Promise<Post> {
    const post = await this.findOne(postId);

    if (post.authorId !== userId && userRole !== 'ADMIN') {
      throw new ForbiddenException('You are not allowed to update this post.');
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
  ): Promise<void> {
    const post = await this.findOne(postId);

    if (post.authorId !== userId && userRole !== 'ADMIN') {
      throw new ForbiddenException('You are not allowed to delete this post.');
    }

    await this.prisma.post.update({
      where: { id: postId },
      data: { visibility: 'DELETING' },
    });

    await this.postDeletionQueue.add('delete-post', {
      postId,
    } satisfies DeletePostJob);
  }
}
