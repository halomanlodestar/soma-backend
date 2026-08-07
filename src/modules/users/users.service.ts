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

    return user.profile ? user : new NotFoundError('User profile not found');
  }

  async findByUsername(username: string): Promise<UserResult> {
    const user = await this.prisma.user.findFirst({
      where: { profile: { is: { username } } },
      include: { profile: true },
    });

    if (!user) {
      return new NotFoundError('User not found');
    }

    return user.profile ? user : new NotFoundError('User profile not found');
  }

  async updateProfile(
    userId: string,
    updateUserProfileDto: UpdateUserProfileDto,
  ): Promise<UserResult> {
    try {
      const user = await this.prisma.user.update({
        where: { id: userId },
        data: {
          profile: {
            update: {
              displayName: updateUserProfileDto.displayName,
              bio: updateUserProfileDto.bio,
              avatarUrl: updateUserProfileDto.avatarUrl,
              coverUrl: updateUserProfileDto.coverUrl,
            },
          },
        },
        include: { profile: true },
      });

      return user.profile ? user : new NotFoundError('User profile not found');
    } catch {
      return new NotFoundError('User not found');
    }
  }
}
