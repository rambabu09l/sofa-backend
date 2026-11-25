import type { SuperTokensAppRole } from '../../../config/supertokens-roles';

export type AuthUser = {
  id: string;
  email: string;
  displayName: string;
  avatarUrl: string | null;
  emailVerified: boolean;
  /** App system role codes from user_system_role_mapping (e.g. SUPERADMIN). */
  roles: string[];
  /**
   * Coarse Sofa role from SuperTokens `st-role` claim
   * (`superadmin` | `owner` | `member`). Permissions stay in MySQL.
   */
  appRole: SuperTokensAppRole | null;
  tokenJti?: string;
  tokenExp: number;
};
