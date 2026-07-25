import { createUnionType } from '@nestjs/graphql';
import { Notification as NotificationEntity } from '../entities/notification.entity';
import {
  NotFoundError,
  UnauthorizedError,
} from '../../../common/errors/graphql-errors';

export const NotificationResultUnion = createUnionType({
  name: 'NotificationResult',
  types: () => [NotificationEntity, NotFoundError, UnauthorizedError] as const,
  resolveType: (value) => {
    if (value instanceof NotFoundError) return NotFoundError;
    if (value instanceof UnauthorizedError) return UnauthorizedError;
    return NotificationEntity;
  },
});
