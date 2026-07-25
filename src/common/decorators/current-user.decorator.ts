import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { GqlExecutionContext, GqlContextType } from '@nestjs/graphql';
import { Request } from 'express';

export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    if (ctx.getType<GqlContextType>() === 'graphql') {
      const gqlCtx = GqlExecutionContext.create(ctx);
      const req = gqlCtx.getContext<{ req: Request }>().req;
      return req.user;
    }
    const request = ctx.switchToHttp().getRequest<Request>();
    return request.user;
  },
);
