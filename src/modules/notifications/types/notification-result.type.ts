import { Notification } from '../entities/notification.entity';
import {
  InvalidInputError,
  NotFoundError,
} from '../../../common/errors/graphql-errors';

export type NotificationResult =
  | Notification
  | InvalidInputError
  | NotFoundError;
