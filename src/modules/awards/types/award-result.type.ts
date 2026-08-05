import { Award } from '../entities/award.entity';
import { InvalidInputError } from '../../../common/errors/graphql-errors';
import { AsyncAccepted } from '../../../common/entities/async-accepted.entity';

export type AwardResult = Award | InvalidInputError | AsyncAccepted;
