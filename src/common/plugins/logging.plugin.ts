import { Plugin } from '@nestjs/apollo';
import {
  ApolloServerPlugin,
  GraphQLRequestListener,
  GraphQLRequestContext,
  BaseContext,
} from '@apollo/server';
import { Logger } from '@nestjs/common';

@Plugin()
export class LoggingPlugin implements ApolloServerPlugin {
  private readonly logger = new Logger('GraphQL');

  requestDidStart(
    requestContext: GraphQLRequestContext<BaseContext>,
  ): Promise<void | GraphQLRequestListener<BaseContext>> {
    const { request } = requestContext;
    const startTime = Date.now();

    return Promise.resolve({
      willSendResponse(): Promise<void> {
        const duration = Date.now() - startTime;
        const operationName = request.operationName || 'UnknownOperation';

        // Skip logging playground introspection queries to reduce noise
        if (operationName !== 'IntrospectionQuery') {
          new Logger('GraphQL').log(`[${operationName}] +${duration}ms`);
        }

        return Promise.resolve();
      },
    });
  }
}
