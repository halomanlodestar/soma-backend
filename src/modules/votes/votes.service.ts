import { Injectable, Inject } from '@nestjs/common';
import { CreateVoteDto } from './dto/create-vote.dto';
import { DeleteVoteDto } from './dto/delete-vote.dto';
import { ClientProxy } from '@nestjs/microservices';
import { InjectRedis } from '@nestjs-modules/ioredis';
import Redis from 'ioredis';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class VotesService {
  constructor(
    @Inject('RMQ_CLIENT') private readonly client: ClientProxy,
    @InjectRedis() private readonly redis: Redis,
    private readonly prisma: PrismaService,
  ) {}

  async upsert(userId: string, createVoteDto: CreateVoteDto): Promise<boolean> {
    const { targetType, targetId, value } = createVoteDto;

    await this.redis.set(`user_vote:${userId}:${targetId}`, value, 'EX', 60);
    this.client.emit('vote.cast', { userId, targetType, targetId, value });

    return true;
  }

  async remove(userId: string, deleteVoteDto: DeleteVoteDto): Promise<boolean> {
    const { targetType, targetId } = deleteVoteDto;

    await this.redis.del(`user_vote:${userId}:${targetId}`);
    this.client.emit('vote.removed', { userId, targetType, targetId });

    return true;
  }

  async getUserVoteValue(
    userId: string,
    targetId: string,
  ): Promise<number | null> {
    const cachedVote = await this.redis.get(`user_vote:${userId}:${targetId}`);
    if (cachedVote !== null) {
      return parseInt(cachedVote, 10);
    }

    const vote = await this.prisma.vote.findFirst({
      where: {
        userId,
        OR: [{ postId: targetId }, { commentId: targetId }],
      },
    });

    return vote ? vote.value : null;
  }
}
