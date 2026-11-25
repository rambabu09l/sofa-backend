import { SetMetadata } from '@nestjs/common';

export const PERMISSIONS_KEY = 'permissions';

/** Require any one of the given SYSTEM permission codes. */
export const RequirePermission = (...permissionCodes: string[]) =>
  SetMetadata(PERMISSIONS_KEY, permissionCodes);
