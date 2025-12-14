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

@Injectable()
export class PostsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, createPostDto: CreatePostDto): Promise<Post> {
    const { title, body, somaId } = createPostDto;

    const soma = await this.prisma.soma.findUnique({
      where: { id: somaId },
    });

    if (!soma) {
      throw new BadRequestException(`Soma with id '${somaId}' does not exist`);
    }

    return this.prisma.post.create({
      data: {
        title,
        body,
        authorId: userId,
        somaId,
      },
    });
  }

  async findBySoma(somaId: string): Promise<Post[]> {
    return this.prisma.post.findMany({
      where: { somaId },
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
      include: {
        votes: {
          select: {
            value: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    const postsWithScores = posts.map((post) => {
      const score = post.votes.reduce((sum, vote) => sum + vote.value, 0);
      const { ...postData } = post;
      return { ...postData, score };
    });

    postsWithScores.sort((a, b) => {
      if (b.score !== a.score) {
        return b.score - a.score;
      }
      return b.createdAt.getTime() - a.createdAt.getTime();
    });

    return postsWithScores.map(({ ...post }) => post);
  }

  async findOne(id: string): Promise<Post> {
    const post = await this.prisma.post.findUnique({
      where: { id },
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
      throw new ForbiddenException(
        'You can only update your own posts unless you are an admin',
      );
    }

    return this.prisma.post.update({
      where: { id: postId },
      data: updatePostDto,
    });
  }

  async remove(
    userId: string,
    userRole: string,
    postId: string,
  ): Promise<Post> {
    const post = await this.findOne(postId);

    // Check authorization: must be author or ADMIN
    if (post.authorId !== userId && userRole !== 'ADMIN') {
      throw new ForbiddenException(
        'You can only delete your own posts unless you are an admin',
      );
    }

    return this.prisma.post.delete({
      where: { id: postId },
    });
  }
}
