import { createUnionType } from '@nestjs/graphql';
import { FollowResponse } from './follow-responses.dto';
import {
  NotFoundError,
  InvalidInputError,
} from '../../../common/errors/graphql-errors';

export const FollowResultUnion = createUnionType({
  name: 'FollowResult',
  types: () => [FollowResponse, NotFoundError, InvalidInputError] as const,
  resolveType: (value) => {
    if (value instanceof NotFoundError) return NotFoundError;
    if (value instanceof InvalidInputError) return InvalidInputError;
    return FollowResponse;
  },
});
