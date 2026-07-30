import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { createHmac, randomBytes } from 'node:crypto';
import { AUTH_TOKEN_LIFETIMES } from '../../config/auth-token.constants';
import { PrismaService } from '../../prisma/prisma.service';
import { LoginResponseDto } from './dto/login-response.dto';
import type {
  AuthSessionMetadata,
  GoogleUserData,
  LoginUser,
  RefreshResult,
} from './types/auth.types';

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

  async login(
    user: LoginUser,
    sessionMetadata: AuthSessionMetadata = { clientType: 'WEB' },
  ): Promise<LoginResponseDto> {
    const now = new Date();
    const sessionExpiresAt = this.addDays(
      now,
      AUTH_TOKEN_LIFETIMES.sessionDays,
    );
    const refreshToken = this.createRefreshToken();
    const refreshTokenExpiresAt = this.getRefreshTokenExpiry(
      now,
      sessionExpiresAt,
    );

    const session = await this.prisma.authSession.create({
      data: {
        userId: user.id,
        clientType: sessionMetadata.clientType,
        deviceName: sessionMetadata.deviceName,
        userAgent: sessionMetadata.userAgent,
        expiresAt: sessionExpiresAt,
        refreshTokens: {
          create: {
            tokenHash: this.hashRefreshToken(refreshToken),
            expiresAt: refreshTokenExpiresAt,
          },
        },
      },
    });

    const accessToken = await this.createAccessToken(user, session.id);

    return {
      accessToken,
      accessTokenExpiresIn: AUTH_TOKEN_LIFETIMES.accessTokenSeconds,
      refreshToken,
      sessionId: session.id,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        displayName: user.displayName,
        role: user.role,
      },
    };
  }

  async refresh(refreshToken: string): Promise<LoginResponseDto> {
    const now = new Date();
    const tokenHash = this.hashRefreshToken(refreshToken);
    const newRefreshToken = this.createRefreshToken();

    const result = await this.prisma.$transaction<RefreshResult>(async (tx) => {
      const existingToken = await tx.refreshToken.findUnique({
        where: { tokenHash },
        include: { session: { include: { user: true } } },
      });

      if (!existingToken) {
        return { status: 'invalid' };
      }

      const { session } = existingToken;
      if (existingToken.rotatedAt || existingToken.revokedAt) {
        await tx.authSession.updateMany({
          where: { id: session.id, revokedAt: null },
          data: { revokedAt: now },
        });
        await tx.refreshToken.updateMany({
          where: { sessionId: session.id, revokedAt: null },
          data: { revokedAt: now },
        });
        return { status: 'reused' };
      }

      if (
        session.revokedAt ||
        session.expiresAt <= now ||
        existingToken.expiresAt <= now
      ) {
        return { status: 'invalid' };
      }

      const rotation = await tx.refreshToken.updateMany({
        where: {
          id: existingToken.id,
          rotatedAt: null,
          revokedAt: null,
        },
        data: { rotatedAt: now },
      });

      if (rotation.count !== 1) {
        await tx.authSession.updateMany({
          where: { id: session.id, revokedAt: null },
          data: { revokedAt: now },
        });
        await tx.refreshToken.updateMany({
          where: { sessionId: session.id, revokedAt: null },
          data: { revokedAt: now },
        });
        return { status: 'reused' };
      }

      await tx.refreshToken.create({
        data: {
          sessionId: session.id,
          tokenHash: this.hashRefreshToken(newRefreshToken),
          expiresAt: this.getRefreshTokenExpiry(now, session.expiresAt),
        },
      });
      await tx.authSession.update({
        where: { id: session.id },
        data: { lastUsedAt: now },
      });

      return {
        status: 'success',
        user: session.user,
        sessionId: session.id,
        refreshToken: newRefreshToken,
      };
    });

    if (result.status === 'reused') {
      throw new UnauthorizedException('Refresh token reuse detected');
    }
    if (result.status === 'invalid') {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    return {
      accessToken: await this.createAccessToken(result.user, result.sessionId),
      accessTokenExpiresIn: AUTH_TOKEN_LIFETIMES.accessTokenSeconds,
      refreshToken: result.refreshToken,
      sessionId: result.sessionId,
      user: {
        id: result.user.id,
        email: result.user.email,
        username: result.user.username,
        displayName: result.user.displayName,
        role: result.user.role,
      },
    };
  }

  async createHandoff(user: LoginUser): Promise<string> {
    const code = this.createRefreshToken();

    await this.prisma.authHandoff.create({
      data: {
        userId: user.id,
        codeHash: this.hashRefreshToken(code),
        expiresAt: new Date(Date.now() + 60_000),
      },
    });

    return code;
  }

  async exchangeHandoff(code: string): Promise<LoginResponseDto> {
    const now = new Date();
    const handoff = await this.prisma.authHandoff.findUnique({
      where: { codeHash: this.hashRefreshToken(code) },
      include: { user: true },
    });

    if (!handoff || handoff.usedAt || handoff.expiresAt <= now) {
      throw new UnauthorizedException(
        'Invalid or expired authentication handoff',
      );
    }

    const consumed = await this.prisma.authHandoff.updateMany({
      where: { id: handoff.id, usedAt: null },
      data: { usedAt: now },
    });

    if (consumed.count !== 1) {
      throw new UnauthorizedException('Authentication handoff already used');
    }

    return this.login(handoff.user);
  }

  async logout(refreshToken: string): Promise<void> {
    const token = await this.prisma.refreshToken.findUnique({
      where: { tokenHash: this.hashRefreshToken(refreshToken) },
      select: { sessionId: true },
    });

    if (!token) return;

    const now = new Date();

    await this.prisma.$transaction([
      this.prisma.authSession.updateMany({
        where: { id: token.sessionId, revokedAt: null },
        data: { revokedAt: now },
      }),
      this.prisma.refreshToken.updateMany({
        where: { sessionId: token.sessionId, revokedAt: null },
        data: { revokedAt: now },
      }),
    ]);
  }

  async listActiveSessions(userId: string) {
    const now = new Date();
    return this.prisma.authSession.findMany({
      where: { userId, revokedAt: null, expiresAt: { gt: now } },
      orderBy: { lastUsedAt: 'desc' },
      select: {
        id: true,
        clientType: true,
        deviceName: true,
        userAgent: true,
        createdAt: true,
        lastUsedAt: true,
        expiresAt: true,
      },
    });
  }

  async revokeSession(userId: string, sessionId: string): Promise<boolean> {
    const now = new Date();

    return this.prisma.$transaction(async (tx) => {
      const revoked = await tx.authSession.updateMany({
        where: { id: sessionId, userId, revokedAt: null },
        data: { revokedAt: now },
      });

      if (revoked.count === 0) return false;

      await tx.refreshToken.updateMany({
        where: { sessionId, revokedAt: null },
        data: { revokedAt: now },
      });

      return true;
    });
  }

  async revokeAllSessions(userId: string): Promise<number> {
    const now = new Date();

    return this.prisma.$transaction(async (tx) => {
      const sessions = await tx.authSession.findMany({
        where: { userId, revokedAt: null },
        select: { id: true },
      });

      if (sessions.length === 0) return 0;

      const sessionIds = sessions.map((session) => session.id);

      await tx.authSession.updateMany({
        where: { id: { in: sessionIds } },
        data: { revokedAt: now },
      });
      await tx.refreshToken.updateMany({
        where: { sessionId: { in: sessionIds }, revokedAt: null },
        data: { revokedAt: now },
      });

      return sessionIds.length;
    });
  }

  private async createAccessToken(user: LoginUser, sessionId: string) {
    return this.jwtService.signAsync({
      sub: user.id,
      role: user.role,
      sid: sessionId,
    });
  }

  private createRefreshToken(): string {
    return randomBytes(32).toString('base64url');
  }

  private hashRefreshToken(refreshToken: string): string {
    return createHmac(
      'sha256',
      this.configService.getOrThrow<string>('REFRESH_TOKEN_HMAC_SECRET'),
    )
      .update(refreshToken)
      .digest('base64url');
  }

  private getRefreshTokenExpiry(now: Date, sessionExpiresAt: Date): Date {
    const rollingExpiry = this.addDays(
      now,
      AUTH_TOKEN_LIFETIMES.refreshTokenDays,
    );

    return rollingExpiry < sessionExpiresAt ? rollingExpiry : sessionExpiresAt;
  }

  private addDays(date: Date, days: number): Date {
    const result = new Date(date);

    result.setUTCDate(result.getUTCDate() + days);

    return result;
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
