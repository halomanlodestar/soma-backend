import { SomaCreatorApplication } from '../entities/soma-creator-application.entity';
import {
  InvalidInputError,
  NotFoundError,
  UnauthorizedError,
} from '../../../common/errors/graphql-errors';

export type SomaCreatorApplicationResult =
  | SomaCreatorApplication
  | InvalidInputError
  | NotFoundError
  | UnauthorizedError;
