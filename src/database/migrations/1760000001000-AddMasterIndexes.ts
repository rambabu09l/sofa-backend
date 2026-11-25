import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddMasterIndexes1760000001000 implements MigrationInterface {
  name = 'AddMasterIndexes1760000001000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE INDEX ix_master_roles_scope_active
        ON master_roles (scope, is_active)
    `);
    await queryRunner.query(`
      CREATE INDEX ix_master_menu_scope_active
        ON master_menu (scope, is_active)
    `);
    await queryRunner.query(`
      CREATE INDEX ix_master_menu_parent
        ON master_menu (parent_id)
    `);
    await queryRunner.query(`
      CREATE INDEX ix_master_ticket_types_active_sort
        ON master_ticket_types (is_active, sort_order)
    `);
    await queryRunner.query(`
      CREATE INDEX ix_master_ticket_priorities_active
        ON master_ticket_priorities (is_active)
    `);
    await queryRunner.query(`
      CREATE INDEX ix_role_permission_mapping_permission
        ON role_permission_mapping (permission_id)
    `);
    await queryRunner.query(`
      CREATE INDEX ix_role_menu_mapping_menu
        ON role_menu_mapping (menu_id)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX ix_role_menu_mapping_menu ON role_menu_mapping`,
    );
    await queryRunner.query(
      `DROP INDEX ix_role_permission_mapping_permission ON role_permission_mapping`,
    );
    await queryRunner.query(
      `DROP INDEX ix_master_ticket_priorities_active ON master_ticket_priorities`,
    );
    await queryRunner.query(
      `DROP INDEX ix_master_ticket_types_active_sort ON master_ticket_types`,
    );
    await queryRunner.query(
      `DROP INDEX ix_master_menu_parent ON master_menu`,
    );
    await queryRunner.query(
      `DROP INDEX ix_master_menu_scope_active ON master_menu`,
    );
    await queryRunner.query(
      `DROP INDEX ix_master_roles_scope_active ON master_roles`,
    );
  }
}
