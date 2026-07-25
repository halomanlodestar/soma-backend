import { createUnionType } from '@nestjs/graphql';
import { UserResponseDto } from './user-response.dto';
import { NotFoundError } from '../../../common/errors/graphql-errors';

export const UserResultUnion = createUnionType({
  name: 'UserResult',
  types: () => [UserResponseDto, NotFoundError] as const,
  resolveType: (value) => {
    if (value instanceof NotFoundError) {
      return NotFoundError;
    }

    return UserResponseDto;
  },
});
