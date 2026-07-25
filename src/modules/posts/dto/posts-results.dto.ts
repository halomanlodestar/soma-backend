import { createUnionType } from '@nestjs/graphql';
import { Post as PostEntity } from '../entities/post.entity';
import {
  NotFoundError,
  UnauthorizedError,
  InvalidInputError,
} from '../../../common/errors/graphql-errors';

export const PostResultUnion = createUnionType({
  name: 'PostResult',
  types: () =>
    [PostEntity, NotFoundError, UnauthorizedError, InvalidInputError] as const,
  resolveType: (value) => {
    if (value instanceof NotFoundError) return NotFoundError;
    if (value instanceof UnauthorizedError) return UnauthorizedError;
    if (value instanceof InvalidInputError) return InvalidInputError;
    return PostEntity;
  },
});
