import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { MediaCollection } from './entities/media.entity';

@Injectable()
export class MediaService {
  constructor(private readonly prisma: PrismaService) {}

  async getMediaByPost(postId: string): Promise<MediaCollection | null> {
    const result = await this.prisma.mediaCollection.findFirst({
      where: { postId, post: { visibility: 'PUBLISHED' } },
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
