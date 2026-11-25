import UserRoles, {
  UserRoleClaim,
} from 'supertokens-node/recipe/userroles';
import type { SessionContainer } from 'supertokens-node/recipe/session';

/**
 * Coarse Sofa roles stored in SuperTokens UserRoles (no permissions).
 * Fine-grained permission RBAC stays in MySQL (`role_permission_mapping`).
 */
export const SUPERTOKENS_ROLES = {
  SUPERADMIN: 'superadmin',
  OWNER: 'owner',
  MEMBER: 'member',
} as const;

export type SuperTokensAppRole =
  (typeof SUPERTOKENS_ROLES)[keyof typeof SUPERTOKENS_ROLES];

const APP_ROLE_SET = new Set<string>(Object.values(SUPERTOKENS_ROLES));

export function isSuperTokensAppRole(value: string): value is SuperTokensAppRole {
  return APP_ROLE_SET.has(value);
}

/** Ensure the three role definitions exist in Core (empty permission lists). */
export async function ensureSuperTokensAppRoles(): Promise<void> {
  for (const role of Object.values(SUPERTOKENS_ROLES)) {
    await UserRoles.createNewRoleOrAddPermissions(role, []);
  }
}

/**
 * Assign exactly one Sofa app role in SuperTokens.
 * Removes any other `superadmin|owner|member` role first.
 */
export async function assignSuperTokensAppRole(
  tenantId: string,
  userId: string,
  role: SuperTokensAppRole,
): Promise<void> {
  const current = await UserRoles.getRolesForUser(tenantId, userId);
  for (const existing of current.roles) {
    if (isSuperTokensAppRole(existing) && existing !== role) {
      await UserRoles.removeUserRole(tenantId, userId, existing);
    }
  }

  const added = await UserRoles.addRoleToUser(tenantId, userId, role);
  if (added.status === 'UNKNOWN_ROLE_ERROR') {
    await ensureSuperTokensAppRoles();
    const retry = await UserRoles.addRoleToUser(tenantId, userId, role);
    if (retry.status !== 'OK') {
      throw new Error(`Could not assign SuperTokens role "${role}"`);
    }
  }
}

/** Refresh `st-role` on the session created during sign-up. */
export async function refreshSessionAppRoleClaim(
  session: SessionContainer,
): Promise<void> {
  await session.fetchAndSetClaim(UserRoleClaim);
}

/**
 * Read the Sofa app role from the access-token `st-role` claim.
 * Prefers `superadmin` over `owner` over `member` if multiple are present.
 */
export function readAppRoleFromAccessTokenPayload(
  payload: Record<string, unknown>,
): SuperTokensAppRole | null {
  const claim = payload['st-role'];
  const roles = extractRoleArray(claim);
  if (roles.includes(SUPERTOKENS_ROLES.SUPERADMIN)) {
    return SUPERTOKENS_ROLES.SUPERADMIN;
  }
  if (roles.includes(SUPERTOKENS_ROLES.OWNER)) {
    return SUPERTOKENS_ROLES.OWNER;
  }
  if (roles.includes(SUPERTOKENS_ROLES.MEMBER)) {
    return SUPERTOKENS_ROLES.MEMBER;
  }
  return null;
}

function extractRoleArray(claim: unknown): string[] {
  if (Array.isArray(claim)) {
    return claim.filter((entry): entry is string => typeof entry === 'string');
  }
  if (
    typeof claim === 'object' &&
    claim !== null &&
    'v' in claim &&
    Array.isArray((claim as { v: unknown }).v)
  ) {
    return (claim as { v: unknown[] }).v.filter(
      (entry): entry is string => typeof entry === 'string',
    );
  }
  return [];
}
