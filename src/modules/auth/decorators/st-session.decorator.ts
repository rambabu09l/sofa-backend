import {
  createParamDecorator,
  ExecutionContext,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import type { Request } from 'express';
import type { SessionContainer } from 'supertokens-node/recipe/session';

type SessionRequest = Request & { session?: SessionContainer };

/** SuperTokens session from `SofaSuperTokensAuthGuard`. */
export const StSession = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): SessionContainer => {
    const request = ctx.switchToHttp().getRequest<SessionRequest>();
    if (!request.session) {
      throw new HttpException('Session required', HttpStatus.FORBIDDEN);
    }
    return request.session;
  },
);
