import { FollowResult } from './types/follow-result.type';
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Prisma, UserRole } from '../../prisma/generated/client';
import {
  NotFoundError,
  InvalidInputError,
} from '../../common/errors/graphql-errors';
import {
  FollowResponse,
  FollowStatus,
  FollowUserDto,
} from './dto/follow-responses.dto';

@Injectable()
export class FollowService {
  constructor(private prisma: PrismaService) {}

  async follow(followerId: string, followingId: string): Promise<FollowResult> {
    if (followerId === followingId) {
      return new InvalidInputError('Cannot follow yourself');
    }

    const targetUser = await this.prisma.user.findUnique({
      where: { id: followingId },
    });

    if (!targetUser) {
      return new NotFoundError('User not found');
    }

    if (targetUser.role !== UserRole.CREATOR) {
      return new InvalidInputError('Only creators can be followed');
    }

    try {
      await this.prisma.follow.create({
        data: {
          followerId,
          followingId,
        },
      });
      return { success: true };
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        return { success: true, message: 'Already following' };
      }
      throw error;
    }
  }

  async unfollow(
    followerId: string,
    followingId: string,
  ): Promise<FollowResponse> {
    try {
      await this.prisma.follow.delete({
        where: {
          followerId_followingId: {
            followerId,
            followingId,
          },
        },
      });
      return { success: true };
    } catch (error: unknown) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2025'
      ) {
        return { success: true, message: 'Not following' };
      }
      throw error;
    }
  }

  async getFollowers(userId: string): Promise<FollowUserDto[]> {
    const follows = await this.prisma.follow.findMany({
      where: { followingId: userId },
      include: {
        follower: {
          select: {
            id: true,
            username: true,
            displayName: true,
            role: true,
          },
        },
      },
    });
    return follows.map((f) => f.follower as FollowUserDto);
  }

  async getFollowing(userId: string): Promise<FollowUserDto[]> {
    const follows = await this.prisma.follow.findMany({
      where: { followerId: userId },
      include: {
        following: {
          select: {
            id: true,
            username: true,
            displayName: true,
            role: true,
          },
        },
      },
    });
    return follows.map((f) => f.following as FollowUserDto);
  }

  async getFollowStatus(
    followerId: string,
    followingId: string,
  ): Promise<FollowStatus> {
    const follow = await this.prisma.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId,
          followingId,
        },
      },
    });
    return { isFollowing: !!follow };
  }
}
