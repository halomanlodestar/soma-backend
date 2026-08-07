import { NotFoundError } from '../../../common/errors/graphql-errors';
import type { User, UserProfile } from '../../../prisma/generated/client';

export type UserResult = (User & { profile: UserProfile | null }) | NotFoundError;
