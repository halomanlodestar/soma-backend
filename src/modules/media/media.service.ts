import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AttachMediaDto } from './dto/update-media.dto';
import { MediaCollection } from './entities/media.entity';

@Injectable()
export class MediaService {
  constructor(private readonly prisma: PrismaService) {}

  async attachMediaToPost(
    userId: string,
    userRole: string,
    postId: string,
    attachMediaDto: AttachMediaDto,
  ): Promise<MediaCollection> {
    // Verify post exists
    const post = await this.prisma.post.findUnique({
      where: { id: postId },
    });

    if (!post) {
      throw new NotFoundException(`Post with id '${postId}' not found`);
    }

    // Check authorization: must be post author or ADMIN
    if (post.authorId !== userId && userRole !== 'ADMIN') {
      throw new ForbiddenException(
        'You can only attach media to your own posts unless you are an admin',
      );
    }

    // Check if media collection already exists
    let collection = await this.prisma.mediaCollection.findUnique({
      where: { postId },
      include: { items: true },
    });

    // Create collection if it doesn't exist
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
      // Add new media items to existing collection
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
