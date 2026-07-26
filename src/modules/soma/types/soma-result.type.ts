import { Soma } from '../entities/soma.entity';
import {
  InvalidInputError,
  NotFoundError,
} from '../../../common/errors/graphql-errors';

export type SomaResult = Soma | InvalidInputError | NotFoundError;
