import type { AuthService } from '../modules/auth/service/auth.service';

/**
 * Lazy refs so SuperTokens recipe overrides can call Nest services after boot.
 * Wired in `SuperTokensHooksService.onModuleInit`.
 */
export const superTokensHooks = {
  auth: undefined as AuthService | undefined,
};

export function requireSuperTokensAuth(): AuthService {
  if (!superTokensHooks.auth) {
    throw new Error('SuperTokens auth hook is not initialized');
  }
  return superTokensHooks.auth;
}