import {
  Resolver,
  Query,
  Mutation,
  Args,
  createUnionType,
} from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { AwardsService, AwardResult } from './awards.service';
import { CreateAwardDto } from './dto/create-award.dto';
import { Award as AwardEntity } from './entities/award.entity';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { Express } from 'express';
import { InvalidInputError } from '../../common/errors/graphql-errors';

export const AwardResultUnion = createUnionType({
  name: 'AwardResult',
  types: () => [AwardEntity, InvalidInputError] as const,
  resolveType: (value) => {
    if (value instanceof InvalidInputError) return InvalidInputError;
    return AwardEntity;
  },
});

@Resolver(() => AwardEntity)
export class AwardsResolver {
  constructor(private readonly awardsService: AwardsService) {}

  @Mutation(() => AwardResultUnion)
  @UseGuards(JwtAuthGuard)
  async createAward(
    @CurrentUser() user: Express.User,
    @Args('data') createAwardDto: CreateAwardDto,
  ): Promise<AwardResult> {
    return this.awardsService.create(user.id, createAwardDto);
  }

  @Query(() => [AwardEntity])
  async getAwardsByPost(
    @Args('postId') postId: string,
  ): Promise<AwardEntity[]> {
    return this.awardsService.findAllByPost(postId);
  }

  @Query(() => [AwardEntity])
  async getAwardsByComment(
    @Args('commentId') commentId: string,
  ): Promise<AwardEntity[]> {
    return this.awardsService.findAllByComment(commentId);
  }
}
