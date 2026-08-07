import type { UserRole } from '../../prisma/generated/client';

declare global {
  namespace Express {
    interface User {
      id: string;
      email: string;
      platformRole: UserRole;
      profile: {
        username: string;
        displayName: string | null;
      } | null;
    }
  }
}
