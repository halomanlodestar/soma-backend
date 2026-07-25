import { createUnionType } from '@nestjs/graphql';
import { Award as AwardEntity } from '../entities/award.entity';
import { InvalidInputError } from '../../../common/errors/graphql-errors';

export const AwardResultUnion = createUnionType({
  name: 'AwardResult',
  types: () => [AwardEntity, InvalidInputError] as const,
  resolveType: (value) => {
    if (value instanceof InvalidInputError) return InvalidInputError;
    return AwardEntity;
  },
});
