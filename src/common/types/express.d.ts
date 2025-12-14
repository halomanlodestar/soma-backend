import type { UserRole } from '../../prisma/generated/client';

declare global {
  namespace Express {
    interface User {
      id: string;
      email: string;
      username: string;
      role: UserRole;
    }
  }
}
