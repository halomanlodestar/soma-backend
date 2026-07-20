import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../prisma/prisma.service';
import { LoginResponseDto } from './dto/login-response.dto';

interface GoogleUserData {
  email: string;
  displayName: string;
  profilePhoto?: string;
}

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async validateGoogleUser(googleUser: GoogleUserData) {
    const { email, displayName } = googleUser;

    let user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      const username = await this.generateUniqueUsername(email, displayName);

      user = await this.prisma.user.create({
        data: {
          email,
          username,
          displayName,
          role: 'VIEWER',
        },
      });
    }

    return user;
  }

  async validateUser(userId: string) {
    return this.prisma.user.findUnique({
      where: { id: userId },
    });
  }

  async login(user: Record<string, any>): Promise<LoginResponseDto> {
    const payload = { sub: user.id as string, role: user.role as string };
    const accessToken = await this.jwtService.signAsync(payload);

    return {
      accessToken,
      user: {
        id: user.id as string,
        email: user.email as string,
        username: user.username as string,
        displayName: user.displayName as string | null,
        role: user.role as string,
      },
    };
  }

  private async generateUniqueUsername(
    email: string,
    displayName: string,
  ): Promise<string> {
    const baseUsername = email
      .split('@')[0]
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '');

    const existingUser = await this.prisma.user.findUnique({
      where: { username: baseUsername },
    });

    if (!existingUser) {
      return baseUsername;
    }

    if (displayName) {
      const nameUsername = displayName.toLowerCase().replace(/[^a-z0-9]/g, '');
      const existingNameUser = await this.prisma.user.findUnique({
        where: { username: nameUsername },
      });

      if (!existingNameUser) {
        return nameUsername;
      }
    }

    let attempts = 0;
    while (attempts < 10) {
      const randomSuffix = Math.floor(Math.random() * 10000);
      const candidateUsername = `${baseUsername}${randomSuffix}`;

      const existing = await this.prisma.user.findUnique({
        where: { username: candidateUsername },
      });

      if (!existing) {
        return candidateUsername;
      }

      attempts++;
    }

    return `${baseUsername}${Date.now()}`;
  }
}
