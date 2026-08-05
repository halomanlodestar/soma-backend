import { Comment } from '../entities/comment.entity';
import {
  InvalidInputError,
  NotFoundError,
  UnauthorizedError,
} from '../../../common/errors/graphql-errors';
import { AsyncAccepted } from '../../../common/entities/async-accepted.entity';

export type CommentResult =
  | Comment
  | InvalidInputError
  | NotFoundError
  | UnauthorizedError
  | AsyncAccepted;
