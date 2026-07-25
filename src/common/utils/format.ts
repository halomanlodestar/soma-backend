import { GraphQLFormattedError } from 'graphql/error';

export const formatError = (error: GraphQLFormattedError) => {
  const originalError = error.extensions?.originalError as
    | Record<string, unknown>
    | undefined;

  if (!originalError) {
    return {
      message: error.message,
      code: error.extensions?.code || 'INTERNAL_SERVER_ERROR',
    };
  }

  return {
    message: (originalError.message as string) || error.message,
    code: (originalError.error as string) || error.extensions?.code,
    statusCode: originalError.statusCode as number | undefined,
  };
};
