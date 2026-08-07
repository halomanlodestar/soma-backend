import { UnauthorizedError } from '../../common/errors/graphql-errors';
import { SomaMembershipsService } from './soma-memberships.service';
import {
  SomaCreatorApplicationStatus,
  SomaMembershipRole,
} from './types/soma-access.enums';

describe('SomaMembershipsService', () => {
  const tx = {
    somaMembership: { upsert: jest.fn() },
    somaAccessAuditLog: { create: jest.fn() },
    somaCreatorApplication: { update: jest.fn() },
  };
  const prisma = {
    somaCreatorApplication: { findUnique: jest.fn() },
    somaMembership: { findFirst: jest.fn() },
    $transaction: jest.fn(),
  };
  let service: SomaMembershipsService;

  beforeEach(() => {
    jest.resetAllMocks();
    prisma.$transaction.mockImplementation((callback) => callback(tx));
    service = new SomaMembershipsService(prisma as never);
  });

  it('allows a Soma moderator to approve their own creator application', async () => {
    prisma.somaCreatorApplication.findUnique.mockResolvedValue({
      id: 'application-id',
      applicantId: 'moderator-id',
      somaId: 'soma-id',
    });
    prisma.somaMembership.findFirst.mockResolvedValue({ id: 'moderator-membership-id' });
    tx.somaCreatorApplication.update.mockResolvedValue({ id: 'application-id' });

    const result = await service.reviewApplication('moderator-id', 'VIEWER', {
      applicationId: 'application-id',
      decision: SomaCreatorApplicationStatus.APPROVED,
    });

    expect(result).toEqual({ id: 'application-id' });
    expect(prisma.somaMembership.findFirst).toHaveBeenCalledWith({
      where: {
        userId: 'moderator-id',
        somaId: 'soma-id',
        status: 'ACTIVE',
        role: { in: [SomaMembershipRole.MODERATOR, SomaMembershipRole.OWNER] },
      },
      select: { id: true },
    });
    expect(tx.somaMembership.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        create: expect.objectContaining({
          userId: 'moderator-id',
          somaId: 'soma-id',
          role: SomaMembershipRole.CREATOR,
        }),
      }),
    );
  });

  it('does not let a moderator from another Soma review an application', async () => {
    prisma.somaCreatorApplication.findUnique.mockResolvedValue({
      id: 'application-id',
      applicantId: 'moderator-id',
      somaId: 'soma-id',
    });
    prisma.somaMembership.findFirst.mockResolvedValue(null);

    const result = await service.reviewApplication('moderator-id', 'VIEWER', {
      applicationId: 'application-id',
      decision: SomaCreatorApplicationStatus.APPROVED,
    });

    expect(result).toBeInstanceOf(UnauthorizedError);
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });
});
