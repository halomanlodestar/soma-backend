import { SetMetadata } from '@nestjs/common';
import { UserRole } from '../../prisma/generated/client';

export const PLATFORM_ROLES_KEY = 'platform-roles';
export const RequirePlatformRoles = (...roles: UserRole[]) =>
  SetMetadata(PLATFORM_ROLES_KEY, roles);
