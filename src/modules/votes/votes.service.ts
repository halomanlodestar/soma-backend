import { Injectable, Inject } from '@nestjs/common';
import { CreateVoteDto } from './dto/create-vote.dto';
import { DeleteVoteDto } from './dto/delete-vote.dto';
import { ClientProxy } from '@nestjs/microservices';

@Injectable()
export class VotesService {
  constructor(@Inject('RMQ_CLIENT') private readonly client: ClientProxy) {}

  upsert(userId: string, createVoteDto: CreateVoteDto): boolean {
    const { targetType, targetId, value } = createVoteDto;

    // Asynchronous voting: we emit the event and immediately return success
    this.client.emit('vote.cast', { userId, targetType, targetId, value });
    return true;
  }

  remove(userId: string, deleteVoteDto: DeleteVoteDto): boolean {
    const { targetType, targetId } = deleteVoteDto;
    this.client.emit('vote.removed', { userId, targetType, targetId });
    return true;
  }
}
