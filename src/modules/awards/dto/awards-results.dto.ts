import { createUnionType } from '@nestjs/graphql';
import { Award as AwardEntity } from '../entities/award.entity';
import { InvalidInputError } from '../../../common/errors/graphql-errors';
import { AsyncAccepted } from '../../../common/entities/async-accepted.entity';

export const AwardResultUnion = createUnionType({
  name: 'AwardResult',
  types: () => [AwardEntity, InvalidInputError, AsyncAccepted] as const,
  resolveType: (value) => {
    if (value instanceof InvalidInputError) return InvalidInputError;
    if (value instanceof AsyncAccepted) return AsyncAccepted;
    return AwardEntity;
  },
});
