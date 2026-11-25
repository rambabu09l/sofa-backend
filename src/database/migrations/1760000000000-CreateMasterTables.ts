import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateMasterTables1760000000000 implements MigrationInterface {
  name = 'CreateMasterTables1760000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE users (
        id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        keycloak_id VARCHAR(191) NOT NULL UNIQUE,
        email VARCHAR(320) NOT NULL,
        email_normalized VARCHAR(320) NOT NULL UNIQUE,
        display_name VARCHAR(160) NOT NULL,
        avatar_url VARCHAR(2048),
        is_active BOOLEAN NOT NULL DEFAULT TRUE,
        last_login_at DATETIME(3),
        created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
        updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
        deleted_at DATETIME(3) NULL
      ) ENGINE=InnoDB
    `);

    await queryRunner.query(`
      CREATE TABLE master_roles (
        id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        code VARCHAR(64) NOT NULL UNIQUE,
        name VARCHAR(100) NOT NULL,
        scope ENUM('SYSTEM','ORGANIZATION') NOT NULL,
        description VARCHAR(500),
        is_system BOOLEAN NOT NULL DEFAULT TRUE,
        is_assignable BOOLEAN NOT NULL DEFAULT FALSE,
        is_active BOOLEAN NOT NULL DEFAULT TRUE,
        created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
        updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
        deleted_at DATETIME(3) NULL
      ) ENGINE=InnoDB
    `);

    await queryRunner.query(`
      CREATE TABLE master_permissions (
        id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        code VARCHAR(100) NOT NULL UNIQUE,
        name VARCHAR(150) NOT NULL,
        category VARCHAR(64) NOT NULL,
        scope ENUM('SYSTEM','ORGANIZATION','PROJECT') NOT NULL,
        description VARCHAR(500),
        sort_order INT NOT NULL DEFAULT 0,
        is_active BOOLEAN NOT NULL DEFAULT TRUE,
        created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
        updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
        deleted_at DATETIME(3) NULL,
        KEY ix_permission_scope_category(scope, category, is_active)
      ) ENGINE=InnoDB
    `);

    await queryRunner.query(`
      CREATE TABLE role_permission_mapping (
        role_id BIGINT UNSIGNED NOT NULL,
        permission_id BIGINT UNSIGNED NOT NULL,
        PRIMARY KEY(role_id, permission_id),
        FOREIGN KEY(role_id) REFERENCES master_roles(id),
        FOREIGN KEY(permission_id) REFERENCES master_permissions(id)
      ) ENGINE=InnoDB
    `);

    await queryRunner.query(`
      CREATE TABLE master_menu (
        id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        parent_id BIGINT UNSIGNED NULL,
        code VARCHAR(80) NOT NULL UNIQUE,
        name VARCHAR(120) NOT NULL,
        route VARCHAR(255),
        icon VARCHAR(80),
        scope ENUM('SYSTEM','ORGANIZATION','PROJECT') NOT NULL,
        sort_order INT NOT NULL DEFAULT 0,
        is_active BOOLEAN NOT NULL DEFAULT TRUE,
        created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
        updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
        deleted_at DATETIME(3) NULL,
        FOREIGN KEY(parent_id) REFERENCES master_menu(id)
      ) ENGINE=InnoDB
    `);

    await queryRunner.query(`
      CREATE TABLE role_menu_mapping (
        role_id BIGINT UNSIGNED NOT NULL,
        menu_id BIGINT UNSIGNED NOT NULL,
        PRIMARY KEY(role_id, menu_id),
        FOREIGN KEY(role_id) REFERENCES master_roles(id),
        FOREIGN KEY(menu_id) REFERENCES master_menu(id)
      ) ENGINE=InnoDB
    `);

    await queryRunner.query(`
      CREATE TABLE user_system_role_mapping (
        user_id BIGINT UNSIGNED NOT NULL,
        role_id BIGINT UNSIGNED NOT NULL,
        granted_by BIGINT UNSIGNED NULL,
        granted_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
        PRIMARY KEY(user_id, role_id),
        FOREIGN KEY(user_id) REFERENCES users(id),
        FOREIGN KEY(role_id) REFERENCES master_roles(id),
        FOREIGN KEY(granted_by) REFERENCES users(id)
      ) ENGINE=InnoDB
    `);

    await queryRunner.query(`
      CREATE TABLE master_ticket_types (
        id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        code VARCHAR(40) NOT NULL UNIQUE,
        name VARCHAR(80) NOT NULL,
        sort_order INT NOT NULL DEFAULT 0,
        is_active BOOLEAN NOT NULL DEFAULT TRUE,
        created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
        updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
        deleted_at DATETIME(3) NULL
      ) ENGINE=InnoDB
    `);

    await queryRunner.query(`
      CREATE TABLE master_ticket_priorities (
        id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        code VARCHAR(40) NOT NULL UNIQUE,
        name VARCHAR(80) NOT NULL,
        severity_rank TINYINT UNSIGNED NOT NULL UNIQUE,
        is_active BOOLEAN NOT NULL DEFAULT TRUE,
        created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
        updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
        deleted_at DATETIME(3) NULL
      ) ENGINE=InnoDB
    `);

    await queryRunner.query(`
      INSERT INTO master_roles(code, name, scope, description, is_system, is_assignable) VALUES
        ('SUPERADMIN', 'Super Administrator', 'SYSTEM', 'Platform operator', TRUE, FALSE),
        ('OWNER', 'Owner', 'ORGANIZATION', 'Full organization control', TRUE, TRUE),
        ('MEMBER', 'Member', 'ORGANIZATION', 'Default organization member', TRUE, TRUE)
    `);

    await queryRunner.query(`
      INSERT INTO master_ticket_types(code, name, sort_order) VALUES
        ('BUG', 'Bug', 10),
        ('TASK', 'Task', 20),
        ('FEATURE', 'Feature request', 30),
        ('IMPROVEMENT', 'Improvement', 40)
    `);

    await queryRunner.query(`
      INSERT INTO master_ticket_priorities(code, name, severity_rank) VALUES
        ('CRITICAL', 'Critical', 1),
        ('HIGH', 'High', 2),
        ('MEDIUM', 'Medium', 3),
        ('LOW', 'Low', 4)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS master_ticket_priorities`);
    await queryRunner.query(`DROP TABLE IF EXISTS master_ticket_types`);
    await queryRunner.query(`DROP TABLE IF EXISTS user_system_role_mapping`);
    await queryRunner.query(`DROP TABLE IF EXISTS role_menu_mapping`);
    await queryRunner.query(`DROP TABLE IF EXISTS master_menu`);
    await queryRunner.query(`DROP TABLE IF EXISTS role_permission_mapping`);
    await queryRunner.query(`DROP TABLE IF EXISTS master_permissions`);
    await queryRunner.query(`DROP TABLE IF EXISTS master_roles`);
    await queryRunner.query(`DROP TABLE IF EXISTS users`);
  }
}
