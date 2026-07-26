import { ExecutionContext, Injectable } from '@nestjs/common';
import { GqlExecutionContext, GqlContextType } from '@nestjs/graphql';
import { AuthGuard } from '@nestjs/passport';
import { Request } from 'express';

@Injectable()
export class OptionalJwtAuthGuard extends AuthGuard('jwt') {
  getRequest(context: ExecutionContext): Request {
    if (context.getType<GqlContextType>() === 'graphql') {
      const ctx = GqlExecutionContext.create(context);
      return ctx.getContext<{ req: Request }>().req;
    }
    return context.switchToHttp().getRequest<Request>();
  }

  handleRequest<TUser = any>(
    err: unknown,
    user: Express.User | false | null,
    _info: unknown,
    _context?: ExecutionContext,
    _status?: unknown,
  ): TUser {
    // Return user if available, otherwise return null
    // This makes the guard "optional" - it decodes the token if present,
    // but doesn't throw Unauthorized if the token is missing/invalid.
    return (user || null) as TUser;
  }
}
