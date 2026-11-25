/** FE uses ORG; DB stores ORGANIZATION. */
export const PERMISSION_CATALOG_SCOPES = [
  'ORG',
  'ORGANIZATION',
  'PROJECT',
  'SYSTEM',
] as const;

export type PermissionCatalogScopeQuery =
  (typeof PERMISSION_CATALOG_SCOPES)[number];
