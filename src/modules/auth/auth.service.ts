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

    // Find existing user by email
    let user = await this.prisma.user.findUnique({
      where: { email },
    });

    // Create new user if doesn't exist
    if (!user) {
      const username = await this.generateUniqueUsername(email, displayName);

      user = await this.prisma.user.create({
        data: {
          email,
          username,
          displayName,
          role: 'VIEWER', // Default role
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

  login(user: Record<string, any>): LoginResponseDto {
    const payload = { sub: user.id as string, role: user.role as string };
    const accessToken = this.jwtService.sign(payload);

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
    // Try username from email first
    const baseUsername = email
      .split('@')[0]
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '');

    // Check if base username is available
    const existingUser = await this.prisma.user.findUnique({
      where: { username: baseUsername },
    });

    if (!existingUser) {
      return baseUsername;
    }

    // If not available, try with display name
    if (displayName) {
      const nameUsername = displayName.toLowerCase().replace(/[^a-z0-9]/g, '');
      const existingNameUser = await this.prisma.user.findUnique({
        where: { username: nameUsername },
      });

      if (!existingNameUser) {
        return nameUsername;
      }
    }

    // If still not available, append random numbers
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

    // Fallback to timestamp-based username
    return `${baseUsername}${Date.now()}`;
  }
}
