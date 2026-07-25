import { createUnionType } from '@nestjs/graphql';
import { Comment as CommentEntity } from '../entities/comment.entity';
import {
  NotFoundError,
  UnauthorizedError,
  InvalidInputError,
} from '../../../common/errors/graphql-errors';

export const CommentResultUnion = createUnionType({
  name: 'CommentResult',
  types: () =>
    [
      CommentEntity,
      NotFoundError,
      UnauthorizedError,
      InvalidInputError,
    ] as const,
  resolveType: (value) => {
    if (value instanceof NotFoundError) return NotFoundError;
    if (value instanceof UnauthorizedError) return UnauthorizedError;
    if (value instanceof InvalidInputError) return InvalidInputError;
    return CommentEntity;
  },
});
