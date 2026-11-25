import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import SuperTokens from 'supertokens-node';
import type { SessionContainer } from 'supertokens-node/recipe/session';
import UserMetadata from 'supertokens-node/recipe/usermetadata';
import { rethrowServiceError } from '../../../common/http/service-error';
import {
  SUPERTOKENS_ROLES,
  assignSuperTokensAppRole,
  readAppRoleFromAccessTokenPayload,
  refreshSessionAppRoleClaim,
} from '../../../config/supertokens-roles';
import { PermissionsService } from '../../permissions/service/permissions.service';
import { UsersService } from '../../users/service/users.service';
import {
  SOCIAL_FALLBACK_FIRST_NAME,
  SOCIAL_USER_METADATA_KEYS,
} from '../constants/social-provider-profile.constants';
import { CurrentUserResponseDto } from '../dto/response/auth.res.dto';
import { SocialProvisioningStatusDto } from '../dto/response/social-provisioning.res.dto';
import {
  readProviderAvatarUrl,
  readProviderNames,
  sanitizeAvatarUrl,
  stringMeta,
} from '../helpers/social-provider-profile.helper';
import type { AuthUser } from '../types/auth-user';
import type {
  ProviderUserInfo,
  SocialIdentity,
} from '../types/provider-user-info.types';
import type {
  CompleteSocialSignupInput,
  ProvisionUserFromSuperTokensInput,
} from '../types/social-signup.types';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly users: UsersService,
    private readonly permissions: PermissionsService,
  ) {}

  async authenticateByAuthUserId(
    authUserId: string,
    accessTokenPayload: Record<string, unknown>,
  ): Promise<AuthUser> {
    try {
      const user = await this.users.requireByAuthUserId(authUserId);
      const roles = await this.permissions.listSystemRoleCodes(user.id);
      const appRole = readAppRoleFromAccessTokenPayload(accessTokenPayload);
      const expRaw = accessTokenPayload.exp;
      const tokenExp =
        typeof expRaw === 'number'
          ? expRaw
          : Math.floor(Date.now() / 1000) + 3600;
      return {
        id: user.id,
        email: user.email,
        displayName: user.displayName,
        avatarUrl: user.avatarUrl,
        emailVerified: true,
        roles,
        appRole,
        tokenExp,
      };
    } catch (error) {
      rethrowServiceError(
        error,
        this.logger,
        `AuthService.authenticateByAuthUserId authUserId=${authUserId}`,
        'Could not authenticate the user',
      );
    }
  }

  /**
   * Like {@link authenticateByAuthUserId}, but returns `null` when no Sofa
   * user exists yet (social complete-signup). Disabled accounts still 403.
   */
  async tryAuthenticateByAuthUserId(
    authUserId: string,
    accessTokenPayload: Record<string, unknown>,
  ): Promise<AuthUser | null> {
    const existing = await this.users.findByAuthUserId(authUserId);
    if (!existing) {
      return null;
    }
    return this.authenticateByAuthUserId(authUserId, accessTokenPayload);
  }

  /**
   * Called from SuperTokens `signUpPOST` after Core creates the auth user.
   * @see https://supertokens.com/docs/authentication/email-password/customize-the-sign-up-form
   */
  async provisionUserFromSuperTokens(
    input: ProvisionUserFromSuperTokensInput,
  ): Promise<void> {
    try {
      await this.users.createFromSuperTokens({
        authUserId: input.authUserId,
        email: input.email,
        firstName: input.firstName,
        lastName: input.lastName,
        avatarUrl: input.avatarUrl ?? null,
      });
    } catch (error) {
      rethrowServiceError(
        error,
        this.logger,
        'AuthService.provisionUserFromSuperTokens',
        'Could not create your account',
      );
    }
  }

  async getMe(user: AuthUser): Promise<CurrentUserResponseDto> {
    try {
      const permissions = await this.permissions.listSystemPermissionCodes(
        user.id,
      );
      return {
        id: user.id,
        email: user.email,
        displayName: user.displayName,
        avatarUrl: user.avatarUrl,
        emailVerified: user.emailVerified,
        roles: user.roles,
        appRole: user.appRole,
        permissions,
      };
    } catch (error) {
      rethrowServiceError(
        error,
        this.logger,
        `AuthService.getMe userId=${user.id}`,
        'Could not load your profile',
      );
    }
  }

  async isEmailRegistered(email: string): Promise<boolean> {
    return this.users.isEmailRegistered(email);
  }

  /**
   * Persist Google (etc.) given/family name + profile photo into SuperTokens
   * UserMetadata for the dashboard and complete-signup provisioning.
   * If a Sofa user already exists without an avatar, fill it once.
   */
  async storeSocialProfileFromProvider(
    authUserId: string,
    rawUserInfoFromProvider: ProviderUserInfo,
  ): Promise<void> {
    const { firstName, lastName } = readProviderNames(rawUserInfoFromProvider);
    const avatarUrl = readProviderAvatarUrl(rawUserInfoFromProvider);
    if (!firstName && !lastName && !avatarUrl) {
      return;
    }
    await UserMetadata.updateUserMetadata(authUserId, {
      ...(firstName
        ? { [SOCIAL_USER_METADATA_KEYS.firstName]: firstName }
        : {}),
      ...(lastName ? { [SOCIAL_USER_METADATA_KEYS.lastName]: lastName } : {}),
      ...(avatarUrl
        ? { [SOCIAL_USER_METADATA_KEYS.avatarUrl]: avatarUrl }
        : {}),
    });
    if (avatarUrl) {
      await this.users.setAvatarUrlIfEmpty(authUserId, avatarUrl);
    }
  }

  async getSocialProvisioningStatus(
    authUserId: string,
  ): Promise<SocialProvisioningStatusDto> {
    try {
      const existing = await this.users.findByAuthUserId(authUserId);
      if (existing) {
        return { status: 'ready' };
      }

      const stUser = await SuperTokens.getUser(authUserId);
      const email = stUser?.emails[0] ?? '';
      const metadata = await UserMetadata.getUserMetadata(authUserId);
      const firstName = stringMeta(
        metadata.metadata[SOCIAL_USER_METADATA_KEYS.firstName],
      );
      const lastName = stringMeta(
        metadata.metadata[SOCIAL_USER_METADATA_KEYS.lastName],
      );

      return {
        status: 'needs_provisioning',
        email,
        firstName,
        lastName,
      };
    } catch (error) {
      rethrowServiceError(
        error,
        this.logger,
        `AuthService.getSocialProvisioningStatus authUserId=${authUserId}`,
        'Could not check account status',
      );
    }
  }

  /**
   * Finish Google (or other social) signup.
   * SuperTokens session already exists; creates the Sofa user.
   */
  async completeSocialSignup(
    session: SessionContainer,
    input: CompleteSocialSignupInput,
  ): Promise<CurrentUserResponseDto> {
    const authUserId = session.getUserId();
    try {
      const existing = await this.users.findByAuthUserId(authUserId);
      if (existing) {
        return this.getMe(
          await this.authenticateByAuthUserId(
            authUserId,
            session.getAccessTokenPayload(),
          ),
        );
      }

      const { email, firstName, lastName, avatarUrl } =
        await this.resolveSocialIdentity(
          authUserId,
          input.firstName,
          input.lastName,
        );

      await this.provisionUserFromSuperTokens({
        authUserId,
        email,
        firstName,
        lastName,
        avatarUrl,
      });
      await assignSuperTokensAppRole(
        session.getTenantId(),
        authUserId,
        SUPERTOKENS_ROLES.MEMBER,
      );
      await UserMetadata.updateUserMetadata(authUserId, {
        [SOCIAL_USER_METADATA_KEYS.firstName]: firstName,
        [SOCIAL_USER_METADATA_KEYS.lastName]: lastName,
        ...(avatarUrl
          ? { [SOCIAL_USER_METADATA_KEYS.avatarUrl]: avatarUrl }
          : {}),
      });
      await refreshSessionAppRoleClaim(session);

      return this.getMe(
        await this.authenticateByAuthUserId(
          authUserId,
          session.getAccessTokenPayload(),
        ),
      );
    } catch (error) {
      rethrowServiceError(
        error,
        this.logger,
        `AuthService.completeSocialSignup authUserId=${authUserId}`,
        'Could not finish creating your account',
      );
    }
  }

  /** After an existing social user signs in, refresh `st-role` when provisioned. */
  async refreshRoleClaimIfProvisioned(session: SessionContainer): Promise<void> {
    const user = await this.users.findByAuthUserId(session.getUserId());
    if (!user) {
      return;
    }
    await refreshSessionAppRoleClaim(session);
  }

  private async resolveSocialIdentity(
    authUserId: string,
    overrideFirstName?: string,
    overrideLastName?: string,
  ): Promise<SocialIdentity> {
    const stUser = await SuperTokens.getUser(authUserId);
    const email = stUser?.emails[0]?.trim() ?? '';
    if (!email) {
      throw new HttpException(
        'Google did not provide an email. Use another sign-in method.',
        HttpStatus.BAD_REQUEST,
      );
    }

    const metadata = await UserMetadata.getUserMetadata(authUserId);
    const firstName =
      overrideFirstName?.trim() ||
      stringMeta(metadata.metadata[SOCIAL_USER_METADATA_KEYS.firstName]) ||
      email.split('@')[0] ||
      SOCIAL_FALLBACK_FIRST_NAME;
    const lastName =
      overrideLastName?.trim() ||
      stringMeta(metadata.metadata[SOCIAL_USER_METADATA_KEYS.lastName]) ||
      '';
    const avatarUrl = sanitizeAvatarUrl(
      metadata.metadata[SOCIAL_USER_METADATA_KEYS.avatarUrl],
    );

    return { email, firstName, lastName, avatarUrl };
  }
}