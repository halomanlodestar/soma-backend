import { Award } from '../entities/award.entity';
import { InvalidInputError } from '../../../common/errors/graphql-errors';

export type AwardResult = Award | InvalidInputError;
