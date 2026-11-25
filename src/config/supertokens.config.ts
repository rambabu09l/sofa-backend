import { HttpException } from '@nestjs/common';
import SuperTokens from 'supertokens-node';
import Dashboard from 'supertokens-node/recipe/dashboard';
import EmailPassword from 'supertokens-node/recipe/emailpassword';
import Session from 'supertokens-node/recipe/session';
import ThirdParty from 'supertokens-node/recipe/thirdparty';
import type { ProviderInput } from 'supertokens-node/recipe/thirdparty/types';
import UserMetadata from 'supertokens-node/recipe/usermetadata';
import UserRoles from 'supertokens-node/recipe/userroles';
import { SOCIAL_USER_METADATA_KEYS } from '../modules/auth/constants/social-provider-profile.constants';
import { EnvService } from './env.service';
import { requireSuperTokensAuth } from './supertokens-hooks';
import {
  SUPERTOKENS_ROLES,
  assignSuperTokensAppRole,
  refreshSessionAppRoleClaim,
} from './supertokens-roles';

function formFieldValue(
  formFields: { id: string; value: unknown }[],
  id: string,
): string {
  const field = formFields.find((entry) => entry.id === id);
  return typeof field?.value === 'string' ? field.value.trim() : '';
}

function httpExceptionMessage(error: unknown): string {
  if (!(error instanceof HttpException)) {
    return error instanceof Error
      ? error.message
      : 'Could not create your account';
  }
  const body = error.getResponse();
  if (typeof body === 'string') {
    return body;
  }
  if (typeof body === 'object' && body !== null && 'message' in body) {
    const message = (body as { message?: unknown }).message;
    if (typeof message === 'string') {
      return message;
    }
    if (Array.isArray(message) && typeof message[0] === 'string') {
      return message[0];
    }
  }
  return 'Could not create your account';
}

async function requiredNonEmpty(
  value: unknown,
  label: string,
): Promise<string | undefined> {
  if (typeof value !== 'string' || value.trim().length === 0) {
    return `${label} is required`;
  }
  if (value.trim().length > 180) {
    return `${label} must be at most 180 characters`;
  }
  return undefined;
}

function googleProviders(env: EnvService): ProviderInput[] {
  if (!env.isGoogleOAuthConfigured) {
    return [];
  }
  return [
    {
      config: {
        thirdPartyId: 'google',
        clients: [
          {
            clientId: env.get('GOOGLE_OAUTH_CLIENT_ID').trim(),
            clientSecret: env.get('GOOGLE_OAUTH_CLIENT_SECRET').trim(),
            // Ask Google for email + profile (name) — required for Sofa provisioning.
            scope: [
              'https://www.googleapis.com/auth/userinfo.email',
              'https://www.googleapis.com/auth/userinfo.profile',
            ],
          },
        ],
      },
    },
  ];
}

/**
 * Official Nest SuperTokens module options
 * (custom UI / EmailPassword + ThirdParty + Session + UserMetadata + UserRoles + Dashboard).
 * `appInfo.apiDomain` + `apiBasePath` must match the SPA `supertokens-web-js` init.
 * Dashboard: `{apiDomain}{apiBasePath}/dashboard` (e.g. http://localhost:8089/auth/dashboard).
 * Roles in SuperTokens: `superadmin` | `owner` | `member` (no ST permissions — RBAC stays in MySQL).
 * Dashboard First/Last name come from UserMetadata `first_name` / `last_name`.
 *
 * Google: set `GOOGLE_OAUTH_CLIENT_ID` + `GOOGLE_OAUTH_CLIENT_SECRET`. Frontend callback
 * `{websiteDomain}/login/callback/google` must match the Google Cloud redirect URI
 * (not under `/auth/` — that prefix is SuperTokens APIs on Nest).
 *
 * @see https://supertokens.com/docs/integrations/nestjs
 * @see https://supertokens.com/docs/authentication/social/initial-setup
 * @see https://supertokens.com/docs/authentication/email-password/customize-the-sign-up-form
 * @see https://supertokens.com/docs/post-authentication/user-management/user-metadata
 * @see https://supertokens.com/docs/additional-verification/user-roles/protecting-a-route
 * @see https://supertokens.com/docs/post-authentication/dashboard/initial-setup
 */
export function createSuperTokensModuleOptions(env: EnvService) {
  const websiteDomain = env.publicAppOrigin;
  const apiDomain = env.get('SUPERTOKENS_API_DOMAIN').replace(/\/+$/, '');
  const apiBasePath =
    env.get('SUPERTOKENS_API_BASE_PATH').replace(/\/+$/, '') || '/auth';
  const dashboardAdmins = env.superTokensDashboardAdmins;
  const thirdPartyProviders = googleProviders(env);

  return {
    framework: 'express' as const,
    supertokens: {
      connectionURI: env.get('SUPERTOKENS_CONNECTION_URI').replace(/\/+$/, ''),
      apiKey: env.get('SUPERTOKENS_API_KEY'),
    },
    appInfo: {
      appName: env.get('SUPERTOKENS_APP_NAME'),
      apiDomain,
      websiteDomain,
      apiBasePath,
    },
    recipeList: [
      EmailPassword.init({
        signUpFeature: {
          formFields: [
            {
              id: 'firstName',
              validate: (value) => requiredNonEmpty(value, 'First name'),
            },
            {
              id: 'lastName',
              validate: (value) => requiredNonEmpty(value, 'Last name'),
            },
          ],
        },
        override: {
          apis: (originalImplementation) => ({
            ...originalImplementation,
            signUpPOST: async function (input) {
              if (originalImplementation.signUpPOST === undefined) {
                throw new Error('EmailPassword.signUpPOST is not available');
              }

              const response = await originalImplementation.signUpPOST(input);
              if (response.status !== 'OK') {
                return response;
              }

              const firstName = formFieldValue(input.formFields, 'firstName');
              const lastName = formFieldValue(input.formFields, 'lastName');
              const email =
                response.user.emails[0] ??
                formFieldValue(input.formFields, 'email');

              try {
                await requireSuperTokensAuth().provisionUserFromSuperTokens({
                  authUserId: response.user.id,
                  email,
                  firstName,
                  lastName,
                });
                await assignSuperTokensAppRole(
                  input.tenantId,
                  response.user.id,
                  SUPERTOKENS_ROLES.MEMBER,
                );
                // Dashboard reads First/Last Name from UserMetadata.
                // Custom form fields are not stored by EmailPassword itself.
                await UserMetadata.updateUserMetadata(response.user.id, {
                  [SOCIAL_USER_METADATA_KEYS.firstName]: firstName,
                  [SOCIAL_USER_METADATA_KEYS.lastName]: lastName,
                });
                await refreshSessionAppRoleClaim(response.session);
              } catch (error) {
                await SuperTokens.deleteUser(response.user.id);
                throw new Error(httpExceptionMessage(error));
              }

              return response;
            },
          }),
        },
      }),
      ThirdParty.init({
        signInAndUpFeature: {
          providers: thirdPartyProviders,
        },
        override: {
          functions: (originalImplementation) => ({
            ...originalImplementation,
            signInUp: async function (input) {
              const response = await originalImplementation.signInUp(input);
              if (response.status !== 'OK') {
                return response;
              }

              const isNewSocialUser =
                response.createdNewRecipeUser &&
                response.user.loginMethods.length === 1;

              if (isNewSocialUser) {
                const email = response.user.emails[0] ?? input.email;
                if (
                  email &&
                  (await requireSuperTokensAuth().isEmailRegistered(email))
                ) {
                  // Avoid orphan SuperTokens users when email/password already owns the address.
                  await SuperTokens.deleteUser(response.user.id);
                  return {
                    status: 'SIGN_IN_UP_NOT_ALLOWED',
                    reason:
                      'An account with this email already exists. Sign in with your email and password instead.',
                  };
                }
              }

              await requireSuperTokensAuth().storeSocialProfileFromProvider(
                response.user.id,
                response.rawUserInfoFromProvider,
              );

              return response;
            },
          }),
          apis: (originalImplementation) => ({
            ...originalImplementation,
            signInUpPOST: async function (input) {
              if (originalImplementation.signInUpPOST === undefined) {
                throw new Error('ThirdParty.signInUpPOST is not available');
              }

              const response = await originalImplementation.signInUpPOST(input);
              if (response.status !== 'OK') {
                return response;
              }

              // Existing provisioned users: refresh st-role. New users finish via Nest complete-signup.
              if (!response.createdNewRecipeUser) {
                await requireSuperTokensAuth().refreshRoleClaimIfProvisioned(
                  response.session,
                );
              }

              return response;
            },
          }),
        },
      }),
      Session.init({
        // Cookie for the SPA; header mode for the browser extension (`st-auth-mode: header`).
        getTokenTransferMethod: () => 'any',
        // Immediate revoke (dashboard / revokeAllSessions) requires checkDatabase on verify —
        // see SofaSuperTokensAuthGuard. Stateless JWT verify alone leaves AT usable until exp.
      }),
      UserMetadata.init(),
      // Roles only — never put Sofa permission codes into SuperTokens.
      UserRoles.init({
        skipAddingPermissionsToAccessToken: true,
      }),
      Dashboard.init(
        dashboardAdmins.length > 0 ? { admins: dashboardAdmins } : undefined,
      ),
    ],
  };
}
