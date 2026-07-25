import { createUnionType } from '@nestjs/graphql';
import { Soma as SomaEntity } from '../entities/soma.entity';
import {
  NotFoundError,
  InvalidInputError,
} from '../../../common/errors/graphql-errors';

export const SomaResultUnion = createUnionType({
  name: 'SomaResult',
  types: () => [SomaEntity, NotFoundError, InvalidInputError] as const,
  resolveType: (value) => {
    if (value instanceof NotFoundError) return NotFoundError;
    if (value instanceof InvalidInputError) return InvalidInputError;
    return SomaEntity;
  },
});
