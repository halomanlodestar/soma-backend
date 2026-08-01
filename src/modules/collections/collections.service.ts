import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class CollectionsService {
  constructor(private readonly prisma: PrismaService) {}

  async savePost(userId: string, postId: string) {
    const post = await this.prisma.post.findFirst({
      where: { id: postId, visibility: 'PUBLISHED' },
      select: { id: true },
    });

    if (!post) return null;

    return this.prisma.savedPost.upsert({
      where: { userId_postId: { userId, postId } },
      create: { userId, postId },
      update: {},
    });
  }

  async unsavePost(userId: string, postId: string) {
    await this.prisma.savedPost.deleteMany({ where: { userId, postId } });
    return true;
  }

  async isPostSaved(userId: string, postId: string) {
    return Boolean(
      await this.prisma.savedPost.findUnique({
        where: { userId_postId: { userId, postId } },
        select: { id: true },
      }),
    );
  }

  async savedPosts(userId: string) {
    return this.prisma.post.findMany({
      where: { savedBy: { some: { userId } }, visibility: 'PUBLISHED' },
      orderBy: { savedBy: { _count: 'desc' } },
    });
  }

  createCollection(
    userId: string,
    title: string,
    description?: string,
    isPublic = false,
  ) {
    return this.prisma.collection.create({
      data: { userId, title, description, isPublic },
    });
  }

  myCollections(userId: string) {
    return this.prisma.collection.findMany({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
    });
  }

  async addPost(userId: string, collectionId: string, postId: string) {
    const collection = await this.prisma.collection.findFirst({
      where: { id: collectionId, userId },
    });

    if (!collection) return null;

    const post = await this.prisma.post.findFirst({
      where: { id: postId, visibility: 'PUBLISHED' },
    });

    if (!post) return null;

    const count = await this.prisma.collectionItem.count({
      where: { collectionId },
    });

    return this.prisma.collectionItem.upsert({
      where: { collectionId_postId: { collectionId, postId } },
      create: { collectionId, postId, position: count },
      update: {},
    });
  }

  async collectionItems(userId: string, collectionId: string) {
    const collection = await this.prisma.collection.findFirst({
      where: { id: collectionId, userId },
    });

    if (!collection) return null;

    return this.prisma.collectionItem.findMany({
      where: { collectionId, post: { visibility: 'PUBLISHED' } },
      orderBy: { position: 'asc' },
    });
  }
}
