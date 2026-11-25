import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';

/**
 * Read-only access checks across users / roles / permissions.
 * Documented architecture exception: uses DataSource.getRepository rather than
 * owning those entities.
 */
@Injectable()
export class AccessReadRepository {
  constructor(private readonly dataSource: DataSource) {}

  async listSystemRoleCodes(userId: string): Promise<string[]> {
    const rows: Array<{ code: string }> = await this.dataSource.query(
      `
      SELECT DISTINCT r.code AS code
      FROM user_system_role_mapping usrm
      INNER JOIN master_roles r
        ON r.id = usrm.role_id
       AND r.deleted_at IS NULL
       AND r.is_active = 1
      WHERE usrm.user_id = ?
      ORDER BY r.code ASC
      `,
      [userId],
    );

    return rows.map((row) => row.code);
  }

  async userHasAnySystemPermission(
    userId: string,
    permissionCodes: readonly string[],
  ): Promise<boolean> {
    if (permissionCodes.length === 0) {
      return false;
    }

    const placeholders = permissionCodes.map(() => '?').join(', ');
    const rows: unknown = await this.dataSource.query(
      `
      SELECT 1 AS ok
      FROM user_system_role_mapping usrm
      INNER JOIN master_roles r
        ON r.id = usrm.role_id
       AND r.deleted_at IS NULL
       AND r.is_active = 1
      INNER JOIN role_permission_mapping rpm
        ON rpm.role_id = r.id
      INNER JOIN master_permissions p
        ON p.id = rpm.permission_id
       AND p.deleted_at IS NULL
       AND p.is_active = 1
      WHERE usrm.user_id = ?
        AND p.code IN (${placeholders})
      LIMIT 1
      `,
      [userId, ...permissionCodes],
    );
    return Array.isArray(rows) && rows.length > 0;
  }

  async userHasSystemPermission(
    userId: string,
    permissionCode: string,
  ): Promise<boolean> {
    return this.userHasAnySystemPermission(userId, [permissionCode]);
  }

  async listSystemPermissionCodes(userId: string): Promise<string[]> {
    const rows: Array<{ code: string }> = await this.dataSource.query(
      `
      SELECT DISTINCT p.code AS code
      FROM user_system_role_mapping usrm
      INNER JOIN master_roles r
        ON r.id = usrm.role_id
       AND r.deleted_at IS NULL
       AND r.is_active = 1
      INNER JOIN role_permission_mapping rpm
        ON rpm.role_id = r.id
      INNER JOIN master_permissions p
        ON p.id = rpm.permission_id
       AND p.deleted_at IS NULL
       AND p.is_active = 1
      WHERE usrm.user_id = ?
      ORDER BY p.code ASC
      `,
      [userId],
    );

    return rows.map((row) => row.code);
  }
}
