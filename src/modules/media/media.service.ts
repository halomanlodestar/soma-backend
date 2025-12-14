import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AttachMediaDto } from './dto/update-media.dto';
import { MediaCollection } from './entities/media.entity';
import { PostsService } from '../posts/posts.service';

@Injectable()
export class MediaService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly postsService: PostsService,
  ) {}

  async attachMediaToPost(
    userId: string,
    userRole: string,
    postId: string,
    attachMediaDto: AttachMediaDto,
  ): Promise<MediaCollection> {
    const post = await this.postsService.findOne(postId);

    if (!post) {
      throw new NotFoundException(`Post with id '${postId}' not found`);
    }

    if (post.authorId !== userId && userRole !== 'ADMIN') {
      throw new ForbiddenException(
        'You can only attach media to your own posts unless you are an admin',
      );
    }

    let collection = await this.prisma.mediaCollection.findUnique({
      where: { postId },
      include: { items: true },
    });

    if (!collection) {
      collection = await this.prisma.mediaCollection.create({
        data: {
          postId,
          items: {
            create: attachMediaDto.media.map((item) => ({
              type: item.type,
              originalUrl: item.originalUrl,
              metadata: item.metadata ?? undefined,
            })),
          },
        },
        include: { items: true },
      });
    } else {
      await this.prisma.mediaItem.createMany({
        data: attachMediaDto.media.map((item) => ({
          collectionId: collection!.id,
          type: item.type,
          originalUrl: item.originalUrl,
          metadata: item.metadata ?? undefined,
        })),
      });

      collection = await this.prisma.mediaCollection.findUnique({
        where: { id: collection.id },
        include: { items: true },
      });
    }

    return collection as MediaCollection;
  }

  async getMediaByPost(postId: string): Promise<MediaCollection | null> {
    const result = await this.prisma.mediaCollection.findUnique({
      where: { postId },
      include: {
        items: {
          orderBy: {
            createdAt: 'asc',
          },
        },
      },
    });

    return result as MediaCollection | null;
  }
}
