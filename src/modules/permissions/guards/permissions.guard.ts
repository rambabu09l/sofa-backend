import {
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { PublicAccess } from 'supertokens-nestjs';
import { ErrorCode, HttpUserMessage } from '../../../common/http/http-messages';
import { ALLOW_UNPROVISIONED_SESSION_KEY } from '../../auth/decorators/allow-unprovisioned-session.decorator';
import type { AuthUser } from '../../auth/types/auth-user';
import { ALLOW_AUTHENTICATED_KEY } from '../decorators/allow-authenticated.decorator';
import { PERMISSIONS_KEY } from '../decorators/permissions.decorator';
import { PermissionsService } from '../service/permissions.service';

/**
 * Fail-closed authz at the controller boundary.
 *
 * Allows only when the route declares one of:
 * - `@Public()` / SuperTokens `PublicAccess`
 * - `@RequirePermission(...)` (SYSTEM; enforced here)
 * - `@AllowAuthenticated()` (session required; service must enforce remaining authz)
 * - `@AllowAuthenticated()` + `@AllowUnprovisionedSession()` (SuperTokens session only;
 *   Sofa `request.user` may be missing — Google/social complete-signup)
 *
 * Routes with none of the above are rejected.
 */
@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly permissions: PermissionsService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const targets = [context.getHandler(), context.getClass()];

    const isPublic = this.reflector.getAllAndOverride(PublicAccess, targets);
    if (isPublic) {
      return true;
    }

    const required = this.normalizeRequired(
      this.reflector.getAllAndOverride<string | string[] | undefined>(
        PERMISSIONS_KEY,
        targets,
      ),
    );
    const allowAuthenticated = this.reflector.getAllAndOverride<boolean>(
      ALLOW_AUTHENTICATED_KEY,
      targets,
    );
    const allowUnprovisioned = this.reflector.getAllAndOverride<boolean>(
      ALLOW_UNPROVISIONED_SESSION_KEY,
      targets,
    );

    if (required.length === 0 && !allowAuthenticated) {
      throw new HttpException(
        {
          message:
            'This route is missing an authz declaration (@RequirePermission, @AllowAuthenticated, or @Public)',
          code: ErrorCode.FORBIDDEN,
        },
        HttpStatus.FORBIDDEN,
      );
    }

    const request = context
      .switchToHttp()
      .getRequest<Request & { user?: AuthUser }>();
    const user = request.user;

    if (!user) {
      // Social complete-signup only: SuperTokens session verified upstream;
      // Sofa user row may not exist yet (SessionUserGuard left user unset).
      if (allowAuthenticated && allowUnprovisioned) {
        return true;
      }
      // Not 401: SuperTokens treats 401 as "refresh session" and can clear a live login.
      throw new HttpException(
        {
          message: HttpUserMessage.UNAUTHENTICATED,
          code: ErrorCode.UNAUTHENTICATED,
        },
        HttpStatus.FORBIDDEN,
      );
    }

    if (required.length === 0) {
      return true;
    }

    const allowed = await this.permissions.hasAnySystemPermission(
      user.id,
      required,
    );
    if (!allowed) {
      throw new HttpException(
        {
          message: HttpUserMessage.FORBIDDEN,
          code: ErrorCode.FORBIDDEN,
        },
        HttpStatus.FORBIDDEN,
      );
    }

    return true;
  }

  private normalizeRequired(
    requiredRaw: string | string[] | undefined,
  ): string[] {
    if (!requiredRaw) {
      return [];
    }
    return Array.isArray(requiredRaw) ? requiredRaw : [requiredRaw];
  }
}