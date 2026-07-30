import { UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';

describe('AuthService refresh-token lifecycle', () => {
  const user = {
    id: '019fb3af-9e9f-7b34-9a23-1c7fecb0575e',
    email: 'user@example.com',
    username: 'user',
    displayName: 'User',
    role: 'VIEWER',
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

  it('rotates an active refresh token and returns a new token pair', async () => {
    const now = new Date();
    const transactionClient = {
      refreshToken: {
        findUnique: jest.fn().mockResolvedValue({
          id: 'old-token-id',
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
  });

  it('revokes the session when a rotated refresh token is replayed', async () => {
    const transactionClient = {
      refreshToken: {
        findUnique: jest.fn().mockResolvedValue({
          id: 'old-token-id',
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
