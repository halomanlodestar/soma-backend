import { VoteResultUnion } from './dto/votes-results.dto';
import { Resolver, Mutation, Args } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { VotesService, VoteResult } from './votes.service';
import { CreateVoteDto } from './dto/create-vote.dto';
import { DeleteVoteDto } from './dto/delete-vote.dto';
import { Vote as VoteEntity } from './entities/vote.entity';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { Express } from 'express';

@Resolver(() => VoteEntity)
export class VotesResolver {
  constructor(private readonly votesService: VotesService) {}

  @Mutation(() => VoteResultUnion)
  @UseGuards(JwtAuthGuard)
  async upsertVote(
    @CurrentUser() user: Express.User,
    @Args('data') createVoteDto: CreateVoteDto,
  ): Promise<VoteResult> {
    return this.votesService.upsert(user.id, createVoteDto);
  }

  @Mutation(() => Boolean)
  @UseGuards(JwtAuthGuard)
  async removeVote(
    @CurrentUser() user: Express.User,
    @Args('data') deleteVoteDto: DeleteVoteDto,
  ): Promise<boolean> {
    return this.votesService.remove(user.id, deleteVoteDto);
  }
}
