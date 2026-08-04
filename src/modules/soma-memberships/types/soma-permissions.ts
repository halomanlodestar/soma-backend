import { SomaMembershipRole } from '../../../prisma/generated/client';

export enum SomaPermission {
  PUBLISH = 'PUBLISH',
  MODERATE = 'MODERATE',
  MANAGE_MEMBERS = 'MANAGE_MEMBERS',
}

export const SOMA_PERMISSION_ROLES: Record<
  SomaPermission,
  readonly SomaMembershipRole[]
> = {
  [SomaPermission.PUBLISH]: [
    SomaMembershipRole.CREATOR,
    SomaMembershipRole.MODERATOR,
    SomaMembershipRole.OWNER,
  ],
  [SomaPermission.MODERATE]: [
    SomaMembershipRole.MODERATOR,
    SomaMembershipRole.OWNER,
  ],
  [SomaPermission.MANAGE_MEMBERS]: [SomaMembershipRole.OWNER],
};
