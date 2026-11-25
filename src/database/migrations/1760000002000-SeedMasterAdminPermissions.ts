import { MigrationInterface, QueryRunner } from 'typeorm';

const MASTER_ADMIN_PERMISSIONS: ReadonlyArray<{
  code: string;
  name: string;
  description: string;
  sortOrder: number;
}> = [
  {
    code: 'MASTER_ROLE_VIEW',
    name: 'View master roles',
    description: 'List and read master roles',
    sortOrder: 10,
  },
  {
    code: 'MASTER_ROLE_MANAGE',
    name: 'Manage master roles',
    description: 'Create, update, and delete master roles',
    sortOrder: 11,
  },
  {
    code: 'MASTER_PERMISSION_VIEW',
    name: 'View master permissions',
    description: 'List and read master permissions',
    sortOrder: 20,
  },
  {
    code: 'MASTER_PERMISSION_MANAGE',
    name: 'Manage master permissions',
    description: 'Create, update, and delete master permissions',
    sortOrder: 21,
  },
  {
    code: 'MASTER_MENU_VIEW',
    name: 'View master menus',
    description: 'List and read master menus',
    sortOrder: 30,
  },
  {
    code: 'MASTER_MENU_MANAGE',
    name: 'Manage master menus',
    description: 'Create, update, and delete master menus',
    sortOrder: 31,
  },
  {
    code: 'MASTER_TICKET_TYPE_VIEW',
    name: 'View master ticket types',
    description: 'List and read master ticket types',
    sortOrder: 40,
  },
  {
    code: 'MASTER_TICKET_TYPE_MANAGE',
    name: 'Manage master ticket types',
    description: 'Create, update, and delete master ticket types',
    sortOrder: 41,
  },
  {
    code: 'MASTER_TICKET_PRIORITY_VIEW',
    name: 'View master ticket priorities',
    description: 'List and read master ticket priorities',
    sortOrder: 50,
  },
  {
    code: 'MASTER_TICKET_PRIORITY_MANAGE',
    name: 'Manage master ticket priorities',
    description: 'Create, update, and delete master ticket priorities',
    sortOrder: 51,
  },
  {
    code: 'MASTER_ROLE_PERMISSION_VIEW',
    name: 'View role-permission mappings',
    description: 'List and read role-permission mappings',
    sortOrder: 60,
  },
  {
    code: 'MASTER_ROLE_PERMISSION_MANAGE',
    name: 'Manage role-permission mappings',
    description: 'Create and delete role-permission mappings',
    sortOrder: 61,
  },
  {
    code: 'MASTER_ROLE_MENU_VIEW',
    name: 'View role-menu mappings',
    description: 'List and read role-menu mappings',
    sortOrder: 70,
  },
  {
    code: 'MASTER_ROLE_MENU_MANAGE',
    name: 'Manage role-menu mappings',
    description: 'Create and delete role-menu mappings',
    sortOrder: 71,
  },
];

const CODES = MASTER_ADMIN_PERMISSIONS.map((p) => p.code);

export class SeedMasterAdminPermissions1760000002000 implements MigrationInterface {
  name = 'SeedMasterAdminPermissions1760000002000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    for (const permission of MASTER_ADMIN_PERMISSIONS) {
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
        AND p.code IN (${CODES.map(() => '?').join(', ')})
        AND p.deleted_at IS NULL
      `,
      [...CODES],
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `
      DELETE rpm
      FROM role_permission_mapping rpm
      INNER JOIN master_permissions p ON p.id = rpm.permission_id
      WHERE p.code IN (${CODES.map(() => '?').join(', ')})
      `,
      [...CODES],
    );

    await queryRunner.query(
      `
      DELETE FROM master_permissions
      WHERE code IN (${CODES.map(() => '?').join(', ')})
      `,
      [...CODES],
    );
  }
}
