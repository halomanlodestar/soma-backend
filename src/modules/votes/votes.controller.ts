import {
  Controller,
  Post,
  Body,
  Delete,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { VotesService } from './votes.service';
import { CreateVoteDto } from './dto/create-vote.dto';
import { DeleteVoteDto } from './dto/delete-vote.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { Vote as VoteEntity } from './entities/vote.entity';
import type { Express } from 'express';

@ApiTags('Votes')
@Controller('votes')
export class VotesController {
  constructor(private readonly votesService: VotesService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Upsert (Create or Update) a vote' })
  @ApiResponse({
    status: 201,
    description: 'Vote created or updated successfully',
    type: VoteEntity,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid input or target not found',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  upsert(
    @CurrentUser() user: Express.User,
    @Body() createVoteDto: CreateVoteDto,
  ) {
    return this.votesService.upsert(user.id, createVoteDto);
  }

  @Delete()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a vote' })
  @ApiResponse({
    status: 204,
    description: 'Vote deleted successfully or did not exist',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  remove(
    @CurrentUser() user: Express.User,
    @Body() deleteVoteDto: DeleteVoteDto,
  ) {
    return this.votesService.remove(user.id, deleteVoteDto);
  }
}
