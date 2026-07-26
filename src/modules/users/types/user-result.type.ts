import { UserResponseDto } from '../dto/user-response.dto';
import { NotFoundError } from '../../../common/errors/graphql-errors';

export type UserResult = UserResponseDto | NotFoundError;
