import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  SomaCreatorApplicationStatus,
  SomaMembershipRole,
  SomaMembershipStatus,
  SomaMembershipMode,
} from './types/soma-access.enums';
import { SubmitSomaCreatorApplicationInput } from './dto/submit-soma-creator-application.input';
import { ReviewSomaCreatorApplicationInput } from './dto/review-soma-creator-application.input';
import {
  InvalidInputError,
  NotFoundError,
  UnauthorizedError,
} from '../../common/errors/graphql-errors';
import { SetSomaMembershipRoleInput } from './dto/set-soma-membership-role.input';
import { SetSomaMembershipStatusInput } from './dto/set-soma-membership-status.input';
import { ReviewSomaJoinRequestInput } from './dto/review-soma-join-request.input';
import {
  SomaPermission,
  SOMA_PERMISSION_ROLES,
} from './types/soma-permissions';

import { SomaCreatorApplicationResult } from './types/soma-creator-application-result.type';

@Injectable()
export class SomaMembershipsService {
  constructor(private readonly prisma: PrismaService) {}

  async submitApplication(
    applicantId: string,
    input: SubmitSomaCreatorApplicationInput,
  ): Promise<SomaCreatorApplicationResult> {
    if (!input.moderationConsent) {
      return new InvalidInputError('Moderation consent is required to apply.');
    }

    const soma = await this.prisma.soma.findUnique({
      where: { id: input.somaId },
      select: { id: true },
    });

    if (!soma) return new NotFoundError('Soma not found.');

    const membership = await this.prisma.somaMembership.findUnique({
      where: { userId_somaId: { userId: applicantId, somaId: input.somaId } },
      select: { status: true, role: true },
    });

    if (
      membership?.status === SomaMembershipStatus.ACTIVE &&
      membership.role !== SomaMembershipRole.MEMBER
    ) {
      return new InvalidInputError(
        'You already have an active Soma membership.',
      );
    }

    const existing = await this.prisma.somaCreatorApplication.findUnique({
      where: {
        applicantId_somaId: { applicantId, somaId: input.somaId },
      },
    });

    const activeStatuses: SomaCreatorApplicationStatus[] = [
      SomaCreatorApplicationStatus.SUBMITTED,
      SomaCreatorApplicationStatus.IN_REVIEW,
      SomaCreatorApplicationStatus.APPROVED,
    ];

    if (existing && activeStatuses.includes(existing.status)) {
      return new InvalidInputError(
        'An application for this Soma is already active.',
      );
    }

    const data = {
      portfolioUrls: input.portfolioUrls,
      disciplines: input.disciplines,
      statement: input.statement,
      processSamples: input.processSamples,
      moderationConsent: input.moderationConsent,
      status: SomaCreatorApplicationStatus.SUBMITTED,
      reviewerId: null,
      reviewerNote: null,
      reviewedAt: null,
    };

    if (existing) {
      return this.prisma.somaCreatorApplication.update({
        where: { id: existing.id },
        data,
      });
    }

    return this.prisma.somaCreatorApplication.create({
      data: { ...data, applicantId, somaId: input.somaId },
    });
  }

  async reviewApplication(
    reviewerId: string,
    reviewerRole: string,
    input: ReviewSomaCreatorApplicationInput,
  ): Promise<SomaCreatorApplicationResult> {
    const allowedDecisions: SomaCreatorApplicationStatus[] = [
      SomaCreatorApplicationStatus.APPROVED,
      SomaCreatorApplicationStatus.DECLINED,
      SomaCreatorApplicationStatus.NEEDS_INFO,
    ];

    if (!allowedDecisions.includes(input.decision)) {
      return new InvalidInputError('This application decision is not allowed.');
    }

    const application = await this.prisma.somaCreatorApplication.findUnique({
      where: { id: input.applicationId },
    });

    if (!application)
      return new NotFoundError('Creator application not found.');

    if (application.applicantId === reviewerId) {
      return new UnauthorizedError('You cannot review your own application.');
    }

    if (
      !(await this.canModerateSoma(
        reviewerId,
        reviewerRole,
        application.somaId,
      ))
    ) {
      return new UnauthorizedError(
        'Only a moderator, owner, or admin can review this application.',
      );
    }

    const reviewedAt = new Date();

    return this.prisma.$transaction(async (tx) => {
      if (input.decision === SomaCreatorApplicationStatus.APPROVED) {
        await tx.somaMembership.upsert({
          where: {
            userId_somaId: {
              userId: application.applicantId,
              somaId: application.somaId,
            },
          },
          create: {
            userId: application.applicantId,
            somaId: application.somaId,
            role: SomaMembershipRole.CREATOR,
            status: SomaMembershipStatus.ACTIVE,
            approvedById: reviewerId,
            approvedAt: reviewedAt,
          },
          update: {
            role: SomaMembershipRole.CREATOR,
            status: SomaMembershipStatus.ACTIVE,
            approvedById: reviewerId,
            approvedAt: reviewedAt,
            suspendedAt: null,
            leftAt: null,
          },
        });
      }

      await tx.somaAccessAuditLog.create({
        data: {
          somaId: application.somaId,
          actorId: reviewerId,
          targetUserId: application.applicantId,
          action: 'APPLICATION_REVIEWED',
          metadata: { decision: input.decision },
        },
      });

      return tx.somaCreatorApplication.update({
        where: { id: application.id },
        data: {
          status: input.decision,
          reviewerId,
          reviewerNote: input.reviewerNote ?? null,
          reviewedAt,
        },
      });
    });
  }

  async getMyMembership(userId: string, somaId: string) {
    return this.prisma.somaMembership.findUnique({
      where: { userId_somaId: { userId, somaId } },
    });
  }

  async getMyApplication(userId: string, somaId: string) {
    return this.prisma.somaCreatorApplication.findUnique({
      where: { applicantId_somaId: { applicantId: userId, somaId } },
    });
  }

  async getMyApplications(userId: string) {
    return this.prisma.somaCreatorApplication.findMany({
      where: { applicantId: userId },
      orderBy: { updatedAt: 'desc' },
    });
  }

  async joinSoma(userId: string, somaId: string) {
    const soma = await this.prisma.soma.findUnique({
      where: { id: somaId },
      select: { id: true, membershipMode: true },
    });

    if (!soma) return new NotFoundError('Soma not found.');

    if (soma.membershipMode === SomaMembershipMode.INVITE_ONLY) {
      return new UnauthorizedError('This Soma is invite-only.');
    }

    const existing = await this.getMyMembership(userId, somaId);

    if (existing?.status === SomaMembershipStatus.ACTIVE) {
      return new InvalidInputError('You already belong to this Soma.');
    }

    if (existing?.status === SomaMembershipStatus.PENDING) {
      return new InvalidInputError(
        'Your request to join this Soma is pending.',
      );
    }

    const status =
      soma.membershipMode === SomaMembershipMode.REQUEST
        ? SomaMembershipStatus.PENDING
        : SomaMembershipStatus.ACTIVE;
    const now = new Date();

    return this.prisma.$transaction(async (tx) => {
      const membership = await tx.somaMembership.upsert({
        where: { userId_somaId: { userId, somaId } },
        create: {
          userId,
          somaId,
          role: SomaMembershipRole.MEMBER,
          status,
          approvedAt: status === SomaMembershipStatus.ACTIVE ? now : null,
        },
        update: {
          role: SomaMembershipRole.MEMBER,
          status,
          approvedById: null,
          approvedAt: status === SomaMembershipStatus.ACTIVE ? now : null,
          suspendedAt: null,
          leftAt: null,
        },
      });

      if (status === SomaMembershipStatus.ACTIVE) {
        await tx.soma.update({
          where: { id: somaId },
          data: { memberCount: { increment: 1 } },
        });
      }

      await tx.somaAccessAuditLog.create({
        data: {
          somaId,
          actorId: userId,
          targetUserId: userId,
          action: 'MEMBERSHIP_GRANTED',
          metadata: { status, role: 'MEMBER', selfService: true },
        },
      });

      return membership;
    });
  }

  async leaveSoma(userId: string, somaId: string) {
    const now = new Date();
    const existing = await this.getMyMembership(userId, somaId);

    if (!existing || existing.status === SomaMembershipStatus.LEFT) {
      return new NotFoundError('Active Soma membership not found.');
    }

    if (existing.role === SomaMembershipRole.OWNER) {
      return new UnauthorizedError(
        'A Soma owner cannot leave without transferring ownership.',
      );
    }

    return this.prisma.$transaction(async (tx) => {
      const membership = await tx.somaMembership.update({
        where: { id: existing.id },
        data: { status: SomaMembershipStatus.LEFT, leftAt: now },
      });

      if (existing.status === SomaMembershipStatus.ACTIVE) {
        await tx.soma.update({
          where: { id: somaId },
          data: { memberCount: { decrement: 1 } },
        });
      }

      await tx.somaAccessAuditLog.create({
        data: {
          somaId,
          actorId: userId,
          targetUserId: userId,
          action: 'MEMBERSHIP_STATUS_CHANGED',
          metadata: {
            previousStatus: existing.status,
            status: 'LEFT',
            selfService: true,
          },
        },
      });

      return membership;
    });
  }

  async reviewJoinRequest(
    actorId: string,
    actorRole: string,
    input: ReviewSomaJoinRequestInput,
  ) {
    if (!(await this.canModerateSoma(actorId, actorRole, input.somaId))) {
      return new UnauthorizedError(
        'You cannot review join requests for this Soma.',
      );
    }
    const existing = await this.getMyMembership(input.userId, input.somaId);

    if (
      !existing ||
      existing.status !== SomaMembershipStatus.PENDING ||
      existing.role !== SomaMembershipRole.MEMBER
    ) {
      return new InvalidInputError('No pending member join request was found.');
    }

    const now = new Date();
    const status = input.approve
      ? SomaMembershipStatus.ACTIVE
      : SomaMembershipStatus.LEFT;

    return this.prisma.$transaction(async (tx) => {
      const membership = await tx.somaMembership.update({
        where: { id: existing.id },
        data: {
          status,
          approvedById: input.approve ? actorId : null,
          approvedAt: input.approve ? now : null,
          leftAt: input.approve ? null : now,
        },
      });

      if (input.approve)
        await tx.soma.update({
          where: { id: input.somaId },
          data: { memberCount: { increment: 1 } },
        });

      await tx.somaAccessAuditLog.create({
        data: {
          somaId: input.somaId,
          actorId,
          targetUserId: input.userId,
          action: 'MEMBERSHIP_STATUS_CHANGED',
          metadata: { previousStatus: 'PENDING', status, joinRequest: true },
        },
      });

      return membership;
    });
  }

  async listMemberships(actorId: string, actorRole: string, somaId: string) {
    if (!(await this.canModerateSoma(actorId, actorRole, somaId))) {
      return new UnauthorizedError(
        'You cannot view this Soma membership list.',
      );
    }
    return this.prisma.somaMembership.findMany({
      where: { somaId },
      orderBy: [{ role: 'asc' }, { createdAt: 'asc' }],
    });
  }

  async setMembershipRole(
    actorId: string,
    actorRole: string,
    input: SetSomaMembershipRoleInput,
  ) {
    const targetUser = await this.prisma.user.findUnique({
      where: { id: input.userId },
      select: { id: true },
    });

    if (!targetUser) return new NotFoundError('User not found.');

    const existing = await this.prisma.somaMembership.findUnique({
      where: { userId_somaId: { userId: input.userId, somaId: input.somaId } },
    });
    const isAdmin = actorRole === 'ADMIN';
    const isOwner = await this.hasSomaPermission(
      actorId,
      input.somaId,
      SomaPermission.MANAGE_MEMBERS,
    );
    if (!isAdmin && !isOwner) {
      return new UnauthorizedError(
        'Only a Soma owner or admin can manage roles.',
      );
    }
    if (
      !isAdmin &&
      (input.role === SomaMembershipRole.OWNER ||
        existing?.role === SomaMembershipRole.OWNER)
    ) {
      return new UnauthorizedError(
        'Only an admin can create or change a Soma owner.',
      );
    }
    if (!existing && !isAdmin && input.role === SomaMembershipRole.CREATOR) {
      return new UnauthorizedError(
        'Creator access must be granted through application approval.',
      );
    }
    const now = new Date();
    const membership = await this.prisma.$transaction(async (tx) => {
      const result = await tx.somaMembership.upsert({
        where: {
          userId_somaId: { userId: input.userId, somaId: input.somaId },
        },
        create: {
          userId: input.userId,
          somaId: input.somaId,
          role: input.role,
          status: SomaMembershipStatus.ACTIVE,
          approvedById: actorId,
          approvedAt: now,
        },
        update: {
          role: input.role,
          status: SomaMembershipStatus.ACTIVE,
          approvedById: actorId,
          approvedAt: now,
          suspendedAt: null,
          leftAt: null,
        },
      });

      await tx.somaAccessAuditLog.create({
        data: {
          somaId: input.somaId,
          actorId,
          targetUserId: input.userId,
          action: existing ? 'MEMBERSHIP_ROLE_CHANGED' : 'MEMBERSHIP_GRANTED',
          metadata: { previousRole: existing?.role, role: input.role },
        },
      });

      return result;
    });

    return membership;
  }

  async setMembershipStatus(
    actorId: string,
    actorRole: string,
    input: SetSomaMembershipStatusInput,
  ) {
    const existing = await this.prisma.somaMembership.findUnique({
      where: { userId_somaId: { userId: input.userId, somaId: input.somaId } },
    });

    if (!existing) return new NotFoundError('Soma membership not found.');

    const isAdmin = actorRole === 'ADMIN';
    const isOwner = await this.hasSomaPermission(
      actorId,
      input.somaId,
      SomaPermission.MANAGE_MEMBERS,
    );
    if (!isAdmin && (!isOwner || existing.role === SomaMembershipRole.OWNER)) {
      return new UnauthorizedError('You cannot change this membership status.');
    }

    const now = new Date();

    return this.prisma.$transaction(async (tx) => {
      const result = await tx.somaMembership.update({
        where: { id: existing.id },
        data: {
          status: input.status,
          suspendedAt:
            input.status === SomaMembershipStatus.SUSPENDED ? now : null,
          leftAt: input.status === SomaMembershipStatus.LEFT ? now : null,
        },
      });

      await tx.somaAccessAuditLog.create({
        data: {
          somaId: input.somaId,
          actorId,
          targetUserId: input.userId,
          action: 'MEMBERSHIP_STATUS_CHANGED',
          metadata: { previousStatus: existing.status, status: input.status },
        },
      });

      return result;
    });
  }

  async getReviewQueue(
    reviewerId: string,
    reviewerRole: string,
    somaId: string,
  ) {
    if (!(await this.canModerateSoma(reviewerId, reviewerRole, somaId))) {
      return new UnauthorizedError('You cannot view this Soma review queue.');
    }
    return this.prisma.somaCreatorApplication.findMany({
      where: {
        somaId,
        status: {
          in: [
            SomaCreatorApplicationStatus.SUBMITTED,
            SomaCreatorApplicationStatus.IN_REVIEW,
            SomaCreatorApplicationStatus.NEEDS_INFO,
          ],
        },
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  async hasSomaPermission(
    userId: string,
    somaId: string,
    permission: SomaPermission,
  ): Promise<boolean> {
    const membership = await this.prisma.somaMembership.findFirst({
      where: {
        userId,
        somaId,
        status: SomaMembershipStatus.ACTIVE,
        role: { in: [...SOMA_PERMISSION_ROLES[permission]] },
      },
      select: { id: true },
    });
    return Boolean(membership);
  }

  async canModerateSoma(
    userId: string,
    platformRole: string,
    somaId: string,
  ): Promise<boolean> {
    return (
      platformRole === 'ADMIN' ||
      this.hasSomaPermission(userId, somaId, SomaPermission.MODERATE)
    );
  }

  async getActivePublishingMembership(userId: string, somaId: string) {
    return this.prisma.somaMembership.findFirst({
      where: {
        userId,
        somaId,
        status: SomaMembershipStatus.ACTIVE,
        role: {
          in: [
            SomaMembershipRole.CREATOR,
            SomaMembershipRole.MODERATOR,
            SomaMembershipRole.OWNER,
          ],
        },
      },
    });
  }
}
