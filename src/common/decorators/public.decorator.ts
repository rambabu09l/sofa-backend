import { PublicAccess } from 'supertokens-nestjs';

/**
 * Marks a route public (no SuperTokens session required).
 * Alias for official Nest `PublicAccess` from `supertokens-nestjs`.
 *
 * Coarse roles: use `@VerifySession({ roles: ['owner'] })` from `supertokens-nestjs`
 * (checks SuperTokens `UserRoleClaim` — `superadmin` | `owner` | `member`).
 *
 * @see https://supertokens.com/docs/integrations/nestjs
 */
export const Public = () => PublicAccess();
