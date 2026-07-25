import { createUnionType } from '@nestjs/graphql';
import { Vote as VoteEntity } from '../entities/vote.entity';
import { InvalidInputError } from '../../../common/errors/graphql-errors';

export const VoteResultUnion = createUnionType({
  name: 'VoteResult',
  types: () => [VoteEntity, InvalidInputError] as const,
  resolveType: (value) => {
    if (value instanceof InvalidInputError) return InvalidInputError;
    return VoteEntity;
  },
});
