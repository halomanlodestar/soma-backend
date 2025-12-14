import { UserRole } from '../../prisma/generated/client';

export const users = [
  {
    email: 'admin@soma.com',
    username: 'admin',
    displayName: 'Admin User',
    bio: 'System Administrator',
    role: UserRole.ADMIN,
  },
  {
    email: 'creator@soma.com',
    username: 'creator',
    displayName: 'Creative Mind',
    bio: 'I make things.',
    role: UserRole.CREATOR,
  },
  {
    email: 'viewer@soma.com',
    username: 'viewer',
    displayName: 'Just Looking',
    bio: 'Observer.',
    role: UserRole.VIEWER,
  },
];
