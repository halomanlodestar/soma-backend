import { createUnionType } from '@nestjs/graphql';
import {
  InvalidInputError,
  NotFoundError,
  UnauthorizedError,
} from '../../../common/errors/graphql-errors';
import { SomaCreatorApplication } from '../entities/soma-creator-application.entity';

export const SomaCreatorApplicationResultUnion = createUnionType({
  name: 'SomaCreatorApplicationResult',
  types: () =>
    [
      SomaCreatorApplication,
      InvalidInputError,
      NotFoundError,
      UnauthorizedError,
    ] as const,
  resolveType: (value) => {
    if (value instanceof InvalidInputError) return InvalidInputError;
    if (value instanceof NotFoundError) return NotFoundError;
    if (value instanceof UnauthorizedError) return UnauthorizedError;
    return SomaCreatorApplication;
  },
});
