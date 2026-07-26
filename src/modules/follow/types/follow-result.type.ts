import { FollowResponse } from '../dto/follow-responses.dto';
import {
  InvalidInputError,
  NotFoundError,
} from '../../../common/errors/graphql-errors';

export type FollowResult = FollowResponse | InvalidInputError | NotFoundError;
