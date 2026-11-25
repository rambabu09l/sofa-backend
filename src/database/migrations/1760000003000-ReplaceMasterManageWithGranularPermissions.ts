import { MigrationInterface, QueryRunner } from 'typeorm';

const MANAGE_CODES = [
  'MASTER_ROLE_MANAGE',
  'MASTER_PERMISSION_MANAGE',
  'MASTER_MENU_MANAGE',
  'MASTER_TICKET_TYPE_MANAGE',
  'MASTER_TICKET_PRIORITY_MANAGE',
  'MASTER_ROLE_PERMISSION_MANAGE',
  'MASTER_ROLE_MENU_MANAGE',
] as const;

const GRANULAR_PERMISSIONS: ReadonlyArray<{
  code: string;
  name: string;
  description: string;
  sortOrder: number;
}> = [
  {
    code: 'MASTER_ROLE_CREATE',
    name: 'Create master roles',
    description: 'Create master roles',
    sortOrder: 11,
  },
  {
    code: 'MASTER_ROLE_UPDATE',
    name: 'Update master roles',
    description: 'Update master roles',
    sortOrder: 12,
  },
  {
    code: 'MASTER_ROLE_DELETE',
    name: 'Delete master roles',
    description: 'Soft-delete master roles',
    sortOrder: 13,
  },
  {
    code: 'MASTER_PERMISSION_CREATE',
    name: 'Create master permissions',
    description: 'Create master permissions',
    sortOrder: 21,
  },
  {
    code: 'MASTER_PERMISSION_UPDATE',
    name: 'Update master permissions',
    description: 'Update master permissions',
    sortOrder: 22,
  },
  {
    code: 'MASTER_PERMISSION_DELETE',
    name: 'Delete master permissions',
    description: 'Soft-delete master permissions',
    sortOrder: 23,
  },
  {
    code: 'MASTER_MENU_CREATE',
    name: 'Create master menus',
    description: 'Create master menus',
    sortOrder: 31,
  },
  {
    code: 'MASTER_MENU_UPDATE',
    name: 'Update master menus',
    description: 'Update master menus',
    sortOrder: 32,
  },
  {
    code: 'MASTER_MENU_DELETE',
    name: 'Delete master menus',
    description: 'Soft-delete master menus',
    sortOrder: 33,
  },
  {
    code: 'MASTER_TICKET_TYPE_CREATE',
    name: 'Create master ticket types',
    description: 'Create master ticket types',
    sortOrder: 41,
  },
  {
    code: 'MASTER_TICKET_TYPE_UPDATE',
    name: 'Update master ticket types',
    description: 'Update master ticket types',
    sortOrder: 42,
  },
  {
    code: 'MASTER_TICKET_TYPE_DELETE',
    name: 'Delete master ticket types',
    description: 'Soft-delete master ticket types',
    sortOrder: 43,
  },
  {
    code: 'MASTER_TICKET_PRIORITY_CREATE',
    name: 'Create master ticket priorities',
    description: 'Create master ticket priorities',
    sortOrder: 51,
  },
  {
    code: 'MASTER_TICKET_PRIORITY_UPDATE',
    name: 'Update master ticket priorities',
    description: 'Update master ticket priorities',
    sortOrder: 52,
  },
  {
    code: 'MASTER_TICKET_PRIORITY_DELETE',
    name: 'Delete master ticket priorities',
    description: 'Soft-delete master ticket priorities',
    sortOrder: 53,
  },
  {
    code: 'MASTER_ROLE_PERMISSION_CREATE',
    name: 'Create role-permission mappings',
    description: 'Create role-permission mappings',
    sortOrder: 61,
  },
  {
    code: 'MASTER_ROLE_PERMISSION_DELETE',
    name: 'Delete role-permission mappings',
    description: 'Delete role-permission mappings',
    sortOrder: 62,
  },
  {
    code: 'MASTER_ROLE_MENU_CREATE',
    name: 'Create role-menu mappings',
    description: 'Create role-menu mappings',
    sortOrder: 71,
  },
  {
    code: 'MASTER_ROLE_MENU_DELETE',
    name: 'Delete role-menu mappings',
    description: 'Delete role-menu mappings',
    sortOrder: 72,
  },
];

const GRANULAR_CODES = GRANULAR_PERMISSIONS.map((p) => p.code);

/** Restored on down() so SeedMasterAdminPermissions remains reversible as a pair. */
const MANAGE_PERMISSIONS: ReadonlyArray<{
  code: string;
  name: string;
  description: string;
  sortOrder: number;
}> = [
  {
    code: 'MASTER_ROLE_MANAGE',
    name: 'Manage master roles',
    description: 'Create, update, and delete master roles',
    sortOrder: 11,
  },
  {
    code: 'MASTER_PERMISSION_MANAGE',
    name: 'Manage master permissions',
    description: 'Create, update, and delete master permissions',
    sortOrder: 21,
  },
  {
    code: 'MASTER_MENU_MANAGE',
    name: 'Manage master menus',
    description: 'Create, update, and delete master menus',
    sortOrder: 31,
  },
  {
    code: 'MASTER_TICKET_TYPE_MANAGE',
    name: 'Manage master ticket types',
    description: 'Create, update, and delete master ticket types',
    sortOrder: 41,
  },
  {
    code: 'MASTER_TICKET_PRIORITY_MANAGE',
    name: 'Manage master ticket priorities',
    description: 'Create, update, and delete master ticket priorities',
    sortOrder: 51,
  },
  {
    code: 'MASTER_ROLE_PERMISSION_MANAGE',
    name: 'Manage role-permission mappings',
    description: 'Create and delete role-permission mappings',
    sortOrder: 61,
  },
  {
    code: 'MASTER_ROLE_MENU_MANAGE',
    name: 'Manage role-menu mappings',
    description: 'Create and delete role-menu mappings',
    sortOrder: 71,
  },
];

export class ReplaceMasterManageWithGranularPermissions1760000003000 implements MigrationInterface {
  name = 'ReplaceMasterManageWithGranularPermissions1760000003000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `
      DELETE rpm
      FROM role_permission_mapping rpm
      INNER JOIN master_permissions p ON p.id = rpm.permission_id
      WHERE p.code IN (${MANAGE_CODES.map(() => '?').join(', ')})
      `,
      [...MANAGE_CODES],
    );

    await queryRunner.query(
      `
      DELETE FROM master_permissions
      WHERE code IN (${MANAGE_CODES.map(() => '?').join(', ')})
      `,
      [...MANAGE_CODES],
    );

    for (const permission of GRANULAR_PERMISSIONS) {
      await queryRunner.query(
        `
        INSERT INTO master_permissions
          (code, name, category, scope, description, sort_order, is_active)
        VALUES (?, ?, 'MASTERS', 'SYSTEM', ?, ?, TRUE)
        `,
        [
          permission.code,
          permission.name,
          permission.description,
          permission.sortOrder,
        ],
      );
    }

    await queryRunner.query(
      `
      INSERT INTO role_permission_mapping (role_id, permission_id)
      SELECT r.id, p.id
      FROM master_roles r
      CROSS JOIN master_permissions p
      WHERE r.code = 'SUPERADMIN'
        AND r.deleted_at IS NULL
        AND p.code IN (${GRANULAR_CODES.map(() => '?').join(', ')})
        AND p.deleted_at IS NULL
      `,
      [...GRANULAR_CODES],
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `
      DELETE rpm
      FROM role_permission_mapping rpm
      INNER JOIN master_permissions p ON p.id = rpm.permission_id
      WHERE p.code IN (${GRANULAR_CODES.map(() => '?').join(', ')})
      `,
      [...GRANULAR_CODES],
    );

    await queryRunner.query(
      `
      DELETE FROM master_permissions
      WHERE code IN (${GRANULAR_CODES.map(() => '?').join(', ')})
      `,
      [...GRANULAR_CODES],
    );

    for (const permission of MANAGE_PERMISSIONS) {
      await queryRunner.query(
        `
        INSERT INTO master_permissions
          (code, name, category, scope, description, sort_order, is_active)
        VALUES (?, ?, 'MASTERS', 'SYSTEM', ?, ?, TRUE)
        `,
        [
          permission.code,
          permission.name,
          permission.description,
          permission.sortOrder,
        ],
      );
    }

    await queryRunner.query(
      `
      INSERT INTO role_permission_mapping (role_id, permission_id)
      SELECT r.id, p.id
      FROM master_roles r
      CROSS JOIN master_permissions p
      WHERE r.code = 'SUPERADMIN'
        AND r.deleted_at IS NULL
        AND p.code IN (${MANAGE_CODES.map(() => '?').join(', ')})
        AND p.deleted_at IS NULL
      `,
      [...MANAGE_CODES],
    );
  }
}
