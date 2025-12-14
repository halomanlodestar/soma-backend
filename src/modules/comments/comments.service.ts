import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';
import { PrismaService } from '../../prisma/prisma.service';
import { Comment } from './entities/comment.entity';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class CommentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService,
  ) {}

  async create(
    userId: string,
    postId: string,
    createCommentDto: CreateCommentDto,
  ): Promise<Comment> {
    const post = await this.prisma.post.findUnique({
      where: { id: postId },
    });

    if (!post) {
      throw new BadRequestException(`Post with id '${postId}' does not exist`);
    }

    const comment = await this.prisma.comment.create({
      data: {
        content: createCommentDto.content,
        authorId: userId,
        postId,
      },
    });

    // Notify post author if commenter is not the author
    if (post.authorId !== userId) {
      await this.notificationsService.create({
        userId: post.authorId,
        type: 'COMMENT',
        message: `Someone commented on your post: "${post.title}"`,
        targetType: 'POST',
        targetId: postId,
      });
    }

    return comment;
  }

  async reply(
    userId: string,
    parentCommentId: string,
    createCommentDto: CreateCommentDto,
  ): Promise<Comment> {
    const parent = await this.prisma.comment.findUnique({
      where: { id: parentCommentId },
    });

    if (!parent) {
      throw new BadRequestException(
        `Parent comment with id '${parentCommentId}' does not exist`,
      );
    }

    return this.prisma.comment.create({
      data: {
        content: createCommentDto.content,
        authorId: userId,
        postId: parent.postId,
        parentCommentId: parent.id,
      },
    });
  }

  async findAllByPost(postId: string): Promise<Comment[]> {
    return this.prisma.comment.findMany({
      where: { postId },
      orderBy: {
        createdAt: 'asc',
      },
    });
  }

  async findOne(id: string): Promise<Comment> {
    const comment = await this.prisma.comment.findUnique({
      where: { id },
    });

    if (!comment) {
      throw new NotFoundException(`Comment with id '${id}' not found`);
    }

    return comment;
  }

  async update(
    userId: string,
    userRole: string,
    commentId: string,
    updateCommentDto: UpdateCommentDto,
  ): Promise<Comment> {
    const comment = await this.findOne(commentId);

    if (comment.authorId !== userId && userRole !== 'ADMIN') {
      throw new ForbiddenException(
        'You can only update your own comments unless you are an admin',
      );
    }

    return this.prisma.comment.update({
      where: { id: commentId },
      data: updateCommentDto,
    });
  }

  async remove(
    userId: string,
    userRole: string,
    commentId: string,
  ): Promise<Comment> {
    const comment = await this.findOne(commentId);

    if (comment.authorId !== userId && userRole !== 'ADMIN') {
      throw new ForbiddenException(
        'You can only delete your own comments unless you are an admin',
      );
    }

    return this.prisma.comment.delete({
      where: { id: commentId },
    });
  }
}
