import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PublicAccess, VerifySession } from 'supertokens-nestjs';
import { EmailVerificationClaim } from 'supertokens-node/recipe/emailverification';
import { MultiFactorAuthClaim } from 'supertokens-node/recipe/multifactorauth';
import {
  getSession,
  type SessionClaimValidator,
  type VerifySessionOptions,
} from 'supertokens-node/recipe/session';
import UserRoles from 'supertokens-node/recipe/userroles';

/**
 * SuperTokens Nest auth guard (official decorator model) + immediate revoke.
 *
 * Recommended Nest usage:
 * - Default: session required
 * - `@Public()` / `@PublicAccess()` — open routes
 * - `@VerifySession({ roles: ['owner'] })` — SuperTokens UserRoles (`st-role`)
 *
 * Always sets `checkDatabase: true` so dashboard revoke takes effect immediately
 * (stock `SuperTokensAuthGuard` is otherwise identical but verifies AT statelessly).
 *
 * @see https://supertokens.com/docs/integrations/nestjs
 * @see https://supertokens.com/docs/additional-verification/user-roles/protecting-routes
 * @see https://supertokens.com/docs/post-authentication/session-management/advanced-workflows/access-token-blacklisting
 */
@Injectable()
export class SofaSuperTokensAuthGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // PublicAccess() stores `{}` (Nest createDecorator), not boolean `true`.
    const isPublic = this.reflector.getAllAndOverride(PublicAccess, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();
    const verifySessionOptions = this.getVerifySessionOptions(context);

    const session = await getSession(request, response, {
      ...verifySessionOptions,
      checkDatabase: true,
    });

    request.session = session;
    return true;
  }

  /**
   * Mirrors `supertokens-nestjs` SuperTokensAuthGuard claim wiring for `@VerifySession`.
   */
  private getVerifySessionOptions(
    context: ExecutionContext,
  ): VerifySessionOptions | undefined {
    const verifySessionDecoratorOptions = this.reflector.get(
      VerifySession,
      context.getHandler(),
    );

    const {
      roles,
      permissions,
      requireEmailVerification,
      requireMFA,
      options: verifySessionOptions,
    } = verifySessionDecoratorOptions || {};

    const extraClaimValidators: SessionClaimValidator[] = [];
    const validatorsToRemove: string[] = [];

    if (roles) {
      extraClaimValidators.push(
        UserRoles.UserRoleClaim.validators.includesAll(roles),
      );
    }

    // ST PermissionClaim is supported for completeness; Sofa keeps fine-grained
    // permissions in MySQL (`@RequirePermission`) and does not put them in SuperTokens.
    if (permissions) {
      extraClaimValidators.push(
        UserRoles.PermissionClaim.validators.includesAll(permissions),
      );
    }

    if (requireEmailVerification) {
      extraClaimValidators.push(EmailVerificationClaim.validators.isVerified());
    } else if (requireEmailVerification === false) {
      validatorsToRemove.push(EmailVerificationClaim.key);
    }

    if (requireMFA) {
      extraClaimValidators.push(
        MultiFactorAuthClaim.validators.hasCompletedMFARequirementsForAuth(),
      );
    } else if (requireMFA === false) {
      validatorsToRemove.push(MultiFactorAuthClaim.key);
    }

    const overrideGlobalClaimValidators = async (
      globalValidators: SessionClaimValidator[],
    ) => {
      let parsedValidators = [...globalValidators];
      if (validatorsToRemove.length) {
        parsedValidators = parsedValidators.filter(
          (validator) => !validatorsToRemove.includes(validator.id),
        );
      }
      return [...parsedValidators, ...extraClaimValidators];
    };

    if (!verifySessionOptions) {
      return { overrideGlobalClaimValidators };
    }

    if (verifySessionOptions.overrideGlobalClaimValidators) {
      return {
        overrideGlobalClaimValidators: async (
          globalValidators,
          session,
          userContext,
        ) => {
          const baseValidators =
            await verifySessionOptions.overrideGlobalClaimValidators!(
              globalValidators,
              session,
              userContext,
            );
          return overrideGlobalClaimValidators(baseValidators);
        },
      };
    }

    return {
      ...verifySessionOptions,
      overrideGlobalClaimValidators,
    };
  }
}
