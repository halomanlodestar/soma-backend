import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  SomaCreatorApplicationStatus,
  SomaMembershipRole,
  SomaMembershipStatus,
} from './types/soma-access.enums';
import { SubmitSomaCreatorApplicationInput } from './dto/submit-soma-creator-application.input';
import { ReviewSomaCreatorApplicationInput } from './dto/review-soma-creator-application.input';
import {
  InvalidInputError,
  NotFoundError,
  UnauthorizedError,
} from '../../common/errors/graphql-errors';
import { SomaCreatorApplication } from './entities/soma-creator-application.entity';

export type SomaCreatorApplicationResult =
  | SomaCreatorApplication
  | InvalidInputError
  | NotFoundError
  | UnauthorizedError;

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
      select: { status: true },
    });
    if (membership?.status === SomaMembershipStatus.ACTIVE) {
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

    const canReview = await this.canModerateSoma(
      reviewerId,
      reviewerRole,
      application.somaId,
    );
    if (!canReview) {
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

  async canModerateSoma(
    userId: string,
    platformRole: string,
    somaId: string,
  ): Promise<boolean> {
    if (platformRole === 'ADMIN') return true;

    const membership = await this.prisma.somaMembership.findFirst({
      where: {
        userId,
        somaId,
        status: SomaMembershipStatus.ACTIVE,
        role: { in: [SomaMembershipRole.MODERATOR, SomaMembershipRole.OWNER] },
      },
      select: { id: true },
    });
    return Boolean(membership);
  }
}
