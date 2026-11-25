import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';
import { PublicAccess } from 'supertokens-nestjs';
import type { SessionContainer } from 'supertokens-node/recipe/session';
import { ALLOW_UNPROVISIONED_SESSION_KEY } from '../decorators/allow-unprovisioned-session.decorator';
import { AuthService } from '../service/auth.service';
import type { AuthUser } from '../types/auth-user';

type SessionRequest = Request & {
  session?: SessionContainer;
  user?: AuthUser;
};

/**
 * After SuperTokensAuthGuard, maps `session.getUserId()` → Sofa `AuthUser`.
 *
 * Coarse role (`superadmin|owner|member`) comes from SuperTokens `st-role`.
 * Fine-grained permissions stay in Sofa MySQL RBAC.
 *
 * `@AllowUnprovisionedSession()` still requires a SuperTokens session. If a
 * Sofa user already exists it is attached; if not, the request continues
 * without `request.user` (Google/social complete-signup only).
 */
@Injectable()
export class SofaSessionUserGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly auth: AuthService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // PublicAccess() stores `{}` (Nest createDecorator), not boolean `true`.
    const isPublic = this.reflector.getAllAndOverride(PublicAccess, [
      context.getHandler(),
      context.getClass(),
    ]);

    const request = context.switchToHttp().getRequest<SessionRequest>();
    const session = request.session;

    if (!session) {
      return Boolean(isPublic);
    }

    const allowUnprovisioned = this.reflector.getAllAndOverride<boolean>(
      ALLOW_UNPROVISIONED_SESSION_KEY,
      [context.getHandler(), context.getClass()],
    );
    const authUserId = session.getUserId();
    const accessTokenPayload = session.getAccessTokenPayload();

    if (allowUnprovisioned) {
      const user = await this.auth.tryAuthenticateByAuthUserId(
        authUserId,
        accessTokenPayload,
      );
      if (user) {
        request.user = user;
      }
      return true;
    }

    request.user = await this.auth.authenticateByAuthUserId(
      authUserId,
      accessTokenPayload,
    );
    return true;
  }
}
