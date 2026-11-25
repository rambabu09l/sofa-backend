import { SetMetadata } from '@nestjs/common';

export const ALLOW_UNPROVISIONED_SESSION_KEY = 'allowUnprovisionedSession';

/**
 * Requires a SuperTokens session. Attaches Sofa `request.user` when the
 * MySQL row exists; allows the request without it when it does not yet
 * (Google/social complete-signup). Pair with `@AllowAuthenticated()`.
 */
export const AllowUnprovisionedSession = () =>
  SetMetadata(ALLOW_UNPROVISIONED_SESSION_KEY, true);
