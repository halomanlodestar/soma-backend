import { Resolver, Mutation, Args } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { VotesService } from './votes.service';
import { CreateVoteDto } from './dto/create-vote.dto';
import { DeleteVoteDto } from './dto/delete-vote.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { Express } from 'express';

@Resolver()
export class VotesResolver {
  constructor(private readonly votesService: VotesService) {}

  @Mutation(() => Boolean)
  @UseGuards(JwtAuthGuard)
  upsertVote(
    @CurrentUser() user: Express.User,
    @Args('data') createVoteDto: CreateVoteDto,
  ): boolean {
    return this.votesService.upsert(user.id, createVoteDto);
  }

  @Mutation(() => Boolean)
  @UseGuards(JwtAuthGuard)
  removeVote(
    @CurrentUser() user: Express.User,
    @Args('data') deleteVoteDto: DeleteVoteDto,
  ): boolean {
    return this.votesService.remove(user.id, deleteVoteDto);
  }
}
