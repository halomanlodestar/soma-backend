import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { ForbiddenException, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { Express } from 'express';
import { SomaMembershipsService } from './soma-memberships.service';
import { SubmitSomaCreatorApplicationInput } from './dto/submit-soma-creator-application.input';
import { ReviewSomaCreatorApplicationInput } from './dto/review-soma-creator-application.input';
import { SomaCreatorApplicationResultUnion } from './dto/soma-access-results.dto';
import { SomaCreatorApplication } from './entities/soma-creator-application.entity';
import { SomaMembership } from './entities/soma-membership.entity';
import { SetSomaMembershipRoleInput } from './dto/set-soma-membership-role.input';
import { SetSomaMembershipStatusInput } from './dto/set-soma-membership-status.input';
import { ReviewSomaJoinRequestInput } from './dto/review-soma-join-request.input';

@Resolver()
export class SomaMembershipsResolver {
  constructor(private readonly membershipsService: SomaMembershipsService) {}

  @Mutation(() => SomaCreatorApplicationResultUnion)
  @UseGuards(JwtAuthGuard)
  submitSomaCreatorApplication(
    @CurrentUser() user: Express.User,
    @Args('input') input: SubmitSomaCreatorApplicationInput,
  ) {
    return this.membershipsService.submitApplication(user.id, input);
  }

  @Mutation(() => SomaMembership)
  @UseGuards(JwtAuthGuard)
  async joinSoma(
    @CurrentUser() user: Express.User,
    @Args('somaId') somaId: string,
  ): Promise<SomaMembership> {
    const result = await this.membershipsService.joinSoma(user.id, somaId);
    if ('message' in result) throw new ForbiddenException(result.message);
    return result;
  }

  @Mutation(() => SomaMembership)
  @UseGuards(JwtAuthGuard)
  async leaveSoma(
    @CurrentUser() user: Express.User,
    @Args('somaId') somaId: string,
  ): Promise<SomaMembership> {
    const result = await this.membershipsService.leaveSoma(user.id, somaId);
    if ('message' in result) throw new ForbiddenException(result.message);
    return result;
  }

  @Mutation(() => SomaMembership)
  @UseGuards(JwtAuthGuard)
  async reviewSomaJoinRequest(
    @CurrentUser() user: Express.User,
    @Args('input') input: ReviewSomaJoinRequestInput,
  ): Promise<SomaMembership> {
    const result = await this.membershipsService.reviewJoinRequest(user.id, user.role, input);
    if ('message' in result) throw new ForbiddenException(result.message);
    return result;
  }

  @Mutation(() => SomaCreatorApplicationResultUnion)
  @UseGuards(JwtAuthGuard)
  reviewSomaCreatorApplication(
    @CurrentUser() user: Express.User,
    @Args('input') input: ReviewSomaCreatorApplicationInput,
  ) {
    return this.membershipsService.reviewApplication(user.id, user.role, input);
  }

  @Query(() => SomaMembership, { nullable: true })
  @UseGuards(JwtAuthGuard)
  mySomaMembership(
    @CurrentUser() user: Express.User,
    @Args('somaId') somaId: string,
  ) {
    return this.membershipsService.getMyMembership(user.id, somaId);
  }

  @Query(() => SomaCreatorApplication, { nullable: true })
  @UseGuards(JwtAuthGuard)
  mySomaCreatorApplication(
    @CurrentUser() user: Express.User,
    @Args('somaId') somaId: string,
  ) {
    return this.membershipsService.getMyApplication(user.id, somaId);
  }

  @Query(() => [SomaCreatorApplication])
  @UseGuards(JwtAuthGuard)
  mySomaCreatorApplications(@CurrentUser() user: Express.User) {
    return this.membershipsService.getMyApplications(user.id);
  }

  @Query(() => [SomaMembership])
  @UseGuards(JwtAuthGuard)
  async somaMemberships(
    @CurrentUser() user: Express.User,
    @Args('somaId') somaId: string,
  ): Promise<SomaMembership[]> {
    const result = await this.membershipsService.listMemberships(
      user.id,
      user.role,
      somaId,
    );
    if (!Array.isArray(result)) throw new ForbiddenException(result.message);
    return result;
  }

  @Mutation(() => SomaMembership)
  @UseGuards(JwtAuthGuard)
  async setSomaMembershipRole(
    @CurrentUser() user: Express.User,
    @Args('input') input: SetSomaMembershipRoleInput,
  ): Promise<SomaMembership> {
    const result = await this.membershipsService.setMembershipRole(user.id, user.role, input);
    if ('message' in result) throw new ForbiddenException(result.message);
    return result;
  }

  @Mutation(() => SomaMembership)
  @UseGuards(JwtAuthGuard)
  async setSomaMembershipStatus(
    @CurrentUser() user: Express.User,
    @Args('input') input: SetSomaMembershipStatusInput,
  ): Promise<SomaMembership> {
    const result = await this.membershipsService.setMembershipStatus(user.id, user.role, input);
    if ('message' in result) throw new ForbiddenException(result.message);
    return result;
  }

  @Query(() => [SomaCreatorApplication])
  @UseGuards(JwtAuthGuard)
  async somaCreatorReviewQueue(
    @CurrentUser() user: Express.User,
    @Args('somaId') somaId: string,
  ): Promise<SomaCreatorApplication[]> {
    const result = await this.membershipsService.getReviewQueue(
      user.id,
      user.role,
      somaId,
    );
    if (!Array.isArray(result)) {
      throw new ForbiddenException(result.message);
    }
    return result;
  }
}
