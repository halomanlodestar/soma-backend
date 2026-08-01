import { registerEnumType } from '@nestjs/graphql';
import {
  SomaCreatorApplicationStatus,
  SomaMembershipRole,
  SomaMembershipStatus,
  SomaMembershipMode,
} from '../../../prisma/generated/client';

registerEnumType(SomaMembershipRole, {
  name: 'SomaMembershipRole',
});

registerEnumType(SomaMembershipStatus, {
  name: 'SomaMembershipStatus',
});
registerEnumType(SomaMembershipMode, { name: 'SomaMembershipMode' });

registerEnumType(SomaCreatorApplicationStatus, {
  name: 'SomaCreatorApplicationStatus',
});

export {
  SomaCreatorApplicationStatus,
  SomaMembershipRole,
  SomaMembershipStatus,
  SomaMembershipMode,
};
