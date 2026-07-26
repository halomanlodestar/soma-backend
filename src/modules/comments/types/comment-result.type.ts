import { Comment } from '../entities/comment.entity';
import {
  InvalidInputError,
  NotFoundError,
} from '../../../common/errors/graphql-errors';

export type CommentResult = Comment | InvalidInputError | NotFoundError;
