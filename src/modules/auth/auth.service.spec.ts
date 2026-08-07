import { UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';

describe('AuthService refresh-token lifecycle', () => {
  const user = {
    id: '019fb3af-9e9f-7b34-9a23-1c7fecb0575e',
    email: 'user@example.com',
    platformRole: 'VIEWER' as const,
    profile: {
      username: 'user',
      displayName: 'User',
    },
  };

  const configService = {
    getOrThrow: jest
      .fn()
      .mockReturnValue('a-test-refresh-token-secret-with-32-chars'),
  };
  const jwtService = {
    signAsync: jest.fn().mockResolvedValue('access-token'),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('creates an account, profile, and user from a new Google identity', async () => {
    const createdUser = {
      id: user.id,
      email: user.email,
      platformRole: user.platformRole,
      profile: user.profile,
    };
    const tx = { user: { create: jest.fn().mockResolvedValue(createdUser) } };
    const prisma = {
      authAccount: { findUnique: jest.fn().mockResolvedValue(null) },
      userProfile: { findUnique: jest.fn().mockResolvedValue(null) },
      $transaction: jest.fn((callback) => callback(tx)),
    };
    const service = new AuthService(
      prisma as any,
      jwtService as any,
      configService as any,
    );

    const result = await service.validateGoogleUser({
      providerAccountId: 'google-subject',
      email: user.email,
      emailVerified: true,
      displayName: 'User',
      profilePhoto: 'https://lh3.googleusercontent.com/avatar',
    });

    expect(result).toEqual(user);
    expect(tx.user.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        email: user.email,
        emailVerified: true,
        platformRole: 'VIEWER',
        profile: {
          create: expect.objectContaining({
            username: 'user',
            avatarUrl: 'https://lh3.googleusercontent.com/avatar',
          }),
        },
        authAccounts: {
          create: expect.objectContaining({
            provider: 'GOOGLE',
            providerAccountId: 'google-subject',
          }),
        },
      }),
      include: { profile: true },
    });
  });

  it('logs in through the existing Google account instead of matching by email', async () => {
    const prisma = {
      authAccount: {
        findUnique: jest.fn().mockResolvedValue({ user }),
      },
    };
    const service = new AuthService(
      prisma as any,
      jwtService as any,
      configService as any,
    );

    const result = await service.validateGoogleUser({
      providerAccountId: 'google-subject',
      email: user.email,
      emailVerified: true,
      displayName: 'Changed Google Name',
    });

    expect(result).toEqual(user);
    expect(prisma.authAccount.findUnique).toHaveBeenCalledWith({
      where: {
        provider_providerAccountId: {
          provider: 'GOOGLE',
          providerAccountId: 'google-subject',
        },
      },
      include: { user: { include: { profile: true } } },
    });
  });

  it('creates a 90-day session and a 30-day refresh token on login', async () => {
    const prisma = {
      authSession: {
        create: jest.fn().mockResolvedValue({ id: 'session-id' }),
      },
    };
    const service = new AuthService(
      prisma as any,
      jwtService as any,
      configService as any,
    );

    const before = Date.now();
    const result = await service.login(user, {
      clientType: 'WEB',
      deviceName: 'Chrome',
    });

    const createInput = prisma.authSession.create.mock.calls[0][0];
    const sessionExpiresAt = createInput.data.expiresAt.getTime();
    const refreshExpiresAt =
      createInput.data.refreshTokens.create.expiresAt.getTime();

    expect(result).toMatchObject({
      accessToken: 'access-token',
      accessTokenExpiresIn: 900,
      sessionId: 'session-id',
      user,
    });
    expect(result.refreshToken).toHaveLength(43);
    expect(sessionExpiresAt).toBeGreaterThanOrEqual(
      before + 90 * 24 * 60 * 60 * 1000 - 1000,
    );
    expect(refreshExpiresAt).toBeLessThanOrEqual(
      before + 30 * 24 * 60 * 60 * 1000 + 1000,
    );
    expect(createInput.data.refreshTokens.create.tokenHash).not.toBe(
      result.refreshToken,
    );
  });

  it('returns the existing refresh token before the rotation threshold', async () => {
    const now = new Date();
    const transactionClient = {
      refreshToken: {
        findUnique: jest.fn().mockResolvedValue({
          id: 'old-token-id',
          issuedAt: new Date(now.getTime() - 24 * 24 * 60 * 60 * 1000),
          rotatedAt: null,
          revokedAt: null,
          expiresAt: new Date(now.getTime() + 60_000),
          session: {
            id: 'session-id',
            revokedAt: null,
            expiresAt: new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000),
            user,
          },
        }),
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
        create: jest.fn().mockResolvedValue({}),
      },
      authSession: {
        update: jest.fn().mockResolvedValue({}),
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
      },
    };
    const prisma = {
      $transaction: jest.fn((callback) => callback(transactionClient)),
    };
    const service = new AuthService(
      prisma as any,
      jwtService as any,
      configService as any,
    );

    const result = await service.refresh('old-refresh-token');

    expect(result).toMatchObject({
      accessToken: 'access-token',
      accessTokenExpiresIn: 900,
      sessionId: 'session-id',
      user,
    });
    expect(result.refreshToken).toBe('old-refresh-token');
    expect(transactionClient.refreshToken.updateMany).not.toHaveBeenCalled();
    expect(transactionClient.refreshToken.create).not.toHaveBeenCalled();
    expect(transactionClient.authSession.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ lastUsedAt: expect.any(Date) }),
      }),
    );
  });

  it('rotates a refresh token after 25 days and returns a new token pair', async () => {
    const now = new Date();
    const transactionClient = {
      refreshToken: {
        findUnique: jest.fn().mockResolvedValue({
          id: 'old-token-id',
          issuedAt: new Date(now.getTime() - 25 * 24 * 60 * 60 * 1000),
          rotatedAt: null,
          revokedAt: null,
          expiresAt: new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000),
          session: {
            id: 'session-id',
            revokedAt: null,
            expiresAt: new Date(now.getTime() + 65 * 24 * 60 * 60 * 1000),
            user,
          },
        }),
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
        create: jest.fn().mockResolvedValue({}),
      },
      authSession: {
        update: jest.fn().mockResolvedValue({}),
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
      },
    };
    const prisma = {
      $transaction: jest.fn((callback) => callback(transactionClient)),
    };
    const service = new AuthService(
      prisma as any,
      jwtService as any,
      configService as any,
    );

    const result = await service.refresh('old-refresh-token');

    expect(result.refreshToken).not.toBe('old-refresh-token');
    expect(transactionClient.refreshToken.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ rotatedAt: expect.any(Date) }),
      }),
    );
    expect(transactionClient.refreshToken.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ sessionId: 'session-id' }),
      }),
    );
    const rotationCreateInput =
      transactionClient.refreshToken.create.mock.calls[0][0];
    expect(rotationCreateInput.data.expiresAt.getTime()).toBeLessThanOrEqual(
      now.getTime() + 30 * 24 * 60 * 60 * 1000 + 1_000,
    );
    expect(rotationCreateInput.data.expiresAt.getTime()).toBeGreaterThanOrEqual(
      now.getTime() + 30 * 24 * 60 * 60 * 1000 - 1_000,
    );
  });

  it('revokes the session when a rotated refresh token is replayed', async () => {
    const transactionClient = {
      refreshToken: {
        findUnique: jest.fn().mockResolvedValue({
          id: 'old-token-id',
          issuedAt: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000),
          rotatedAt: new Date(),
          revokedAt: null,
          expiresAt: new Date(Date.now() + 60_000),
          session: {
            id: 'session-id',
            revokedAt: null,
            expiresAt: new Date(Date.now() + 60_000),
            user,
          },
        }),
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
      },
      authSession: {
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
      },
    };
    const prisma = {
      $transaction: jest.fn((callback) => callback(transactionClient)),
    };
    const service = new AuthService(
      prisma as any,
      jwtService as any,
      configService as any,
    );

    await expect(
      service.refresh('replayed-refresh-token'),
    ).rejects.toBeInstanceOf(UnauthorizedException);
    expect(transactionClient.authSession.updateMany).toHaveBeenCalled();
    expect(transactionClient.refreshToken.updateMany).toHaveBeenCalled();
  });
});
