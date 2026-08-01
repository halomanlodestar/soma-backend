import { registerEnumType } from '@nestjs/graphql';
import {
  SomaCreatorApplicationStatus,
  SomaMembershipRole,
  SomaMembershipStatus,
} from '../../../prisma/generated/client';

registerEnumType(SomaMembershipRole, {
  name: 'SomaMembershipRole',
});

registerEnumType(SomaMembershipStatus, {
  name: 'SomaMembershipStatus',
});

registerEnumType(SomaCreatorApplicationStatus, {
  name: 'SomaCreatorApplicationStatus',
});

export {
  SomaCreatorApplicationStatus,
  SomaMembershipRole,
  SomaMembershipStatus,
};
