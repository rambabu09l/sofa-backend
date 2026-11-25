import { SetMetadata } from '@nestjs/common';

export const ALLOW_AUTHENTICATED_KEY = 'allowAuthenticated';

/**
 * Session required; fine-grained org/project/user authz must be enforced in the service.
 * Use this (or `@RequirePermission` / `@Public`) so routes are not denied by the fail-closed PermissionsGuard.
 */
export const AllowAuthenticated = () =>
  SetMetadata(ALLOW_AUTHENTICATED_KEY, true);
