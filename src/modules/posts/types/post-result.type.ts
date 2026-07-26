import { Post } from '../entities/post.entity';
import {
  InvalidInputError,
  NotFoundError,
  UnauthorizedError,
} from '../../../common/errors/graphql-errors';

export type PostResult =
  | Post
  | NotFoundError
  | UnauthorizedError
  | InvalidInputError;
