import { UserResult } from './types/user-result.type';
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { UpdateUserProfileDto } from './dto/update-user-profile.dto';
import { NotFoundError } from '../../common/errors/graphql-errors';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findById(id: string): Promise<UserResult> {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: { profile: true },
    });

    if (!user) {
      return new NotFoundError('User not found');
    }

    return this.toUserResponse(user);
  }

  async findByUsername(username: string): Promise<UserResult> {
    const profile = await this.prisma.userProfile.findUnique({
      where: { username },
      include: { user: true },
    });

    if (!profile) {
      return new NotFoundError('User not found');
    }

    return this.toUserResponse({ ...profile.user, profile });
  }

  async updateProfile(
    userId: string,
    updateUserProfileDto: UpdateUserProfileDto,
  ): Promise<UserResult> {
    try {
      const profile = await this.prisma.userProfile.update({
        where: { userId },
        data: {
          displayName: updateUserProfileDto.displayName,
          bio: updateUserProfileDto.bio,
          avatarUrl: updateUserProfileDto.avatarUrl,
          coverUrl: updateUserProfileDto.coverUrl,
        },
      });

      return this.findById(profile.userId);
    } catch {
      return new NotFoundError('User not found');
    }
  }

  private toUserResponse(user: {
    id: string;
    email: string;
    emailVerified: boolean;
    platformRole: string;
    createdAt: Date;
    updatedAt: Date;
    profile: {
      username: string;
      displayName: string | null;
      bio: string | null;
      avatarUrl: string | null;
      coverUrl: string | null;
    } | null;
  }): UserResult {
    if (!user.profile) return new NotFoundError('User profile not found');

    return {
      id: user.id,
      email: user.email,
      username: user.profile.username,
      displayName: user.profile.displayName,
      bio: user.profile.bio,
      avatarUrl: user.profile.avatarUrl,
      coverUrl: user.profile.coverUrl,
      isVerified: user.emailVerified,
      role: user.platformRole,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }
}
