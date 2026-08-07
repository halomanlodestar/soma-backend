import { FollowResult } from './types/follow-result.type';
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Prisma } from '../../prisma/generated/client';
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

    const creatorMembership = await this.prisma.somaMembership.findFirst({
      where: {
        userId: followingId,
        status: 'ACTIVE',
        role: { in: ['CREATOR', 'MODERATOR', 'OWNER'] },
      },
      select: { id: true },
    });

    if (!creatorMembership) {
      return new InvalidInputError(
        'Only creators approved by at least one Soma can be followed',
      );
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
            platformRole: true,
            profile: { select: { username: true, displayName: true } },
          },
        },
      },
    });
    return follows.map((f) => this.toFollowUser(f.follower));
  }

  async getFollowing(userId: string): Promise<FollowUserDto[]> {
    const follows = await this.prisma.follow.findMany({
      where: { followerId: userId },
      include: {
        following: {
          select: {
            id: true,
            platformRole: true,
            profile: { select: { username: true, displayName: true } },
          },
        },
      },
    });
    return follows.map((f) => this.toFollowUser(f.following));
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

  private toFollowUser(user: {
    id: string;
    platformRole: string;
    profile: { username: string; displayName: string | null } | null;
  }): FollowUserDto {
    if (!user.profile) throw new NotFoundError('User profile not found');

    return {
      id: user.id,
      username: user.profile.username,
      displayName: user.profile.displayName,
      role: user.platformRole,
    };
  }
}
