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
    });

    if (!user) {
      return new NotFoundError('User not found');
    }

    return user;
  }

  async findByUsername(username: string): Promise<UserResult> {
    const user = await this.prisma.user.findUnique({
      where: { username },
    });

    if (!user) {
      return new NotFoundError('User not found');
    }

    return user;
  }

  async updateProfile(
    userId: string,
    updateUserProfileDto: UpdateUserProfileDto,
  ): Promise<UserResult> {
    try {
      const user = await this.prisma.user.update({
        where: { id: userId },
        data: {
          displayName: updateUserProfileDto.displayName,
          bio: updateUserProfileDto.bio,
          avatarUrl: updateUserProfileDto.avatarUrl,
          coverUrl: updateUserProfileDto.coverUrl,
        },
      });

      return user;
    } catch {
      return new NotFoundError('User not found');
    }
  }
}
