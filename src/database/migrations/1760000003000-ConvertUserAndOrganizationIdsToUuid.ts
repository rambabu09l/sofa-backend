import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Converts `users.id` (and `user_system_role_mapping` FKs) from BIGINT to UUID.
 * Organization tables are not part of the Sofa auth shell.
 */
export class ConvertUserAndOrganizationIdsToUuid1760000003000
  implements MigrationInterface
{
  name = 'ConvertUserAndOrganizationIdsToUuid1760000003000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await this.dropForeignKeysReferencingUsers(queryRunner);

    await queryRunner.query(
      `ALTER TABLE users ADD COLUMN uuid_id CHAR(36) NULL`,
    );
    await queryRunner.query(`UPDATE users SET uuid_id = UUID()`);

    await queryRunner.query(`
      ALTER TABLE user_system_role_mapping
        ADD COLUMN user_uuid CHAR(36) NULL,
        ADD COLUMN granted_by_uuid CHAR(36) NULL
    `);
    await queryRunner.query(`
      UPDATE user_system_role_mapping mapping
        JOIN users ON users.id = mapping.user_id
        SET mapping.user_uuid = users.uuid_id
    `);
    await queryRunner.query(`
      UPDATE user_system_role_mapping mapping
        JOIN users ON users.id = mapping.granted_by
        SET mapping.granted_by_uuid = users.uuid_id
    `);
    await queryRunner.query(`
      ALTER TABLE user_system_role_mapping
        DROP PRIMARY KEY,
        DROP COLUMN user_id,
        DROP COLUMN granted_by
    `);
    await queryRunner.query(`
      ALTER TABLE user_system_role_mapping
        RENAME COLUMN user_uuid TO user_id,
        RENAME COLUMN granted_by_uuid TO granted_by
    `);
    await queryRunner.query(`
      ALTER TABLE user_system_role_mapping
        MODIFY user_id CHAR(36) NOT NULL FIRST,
        MODIFY granted_by CHAR(36) NULL AFTER role_id,
        ADD PRIMARY KEY (user_id, role_id)
    `);

    await queryRunner.query(
      `ALTER TABLE users MODIFY id BIGINT UNSIGNED NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE users DROP PRIMARY KEY, DROP COLUMN id`,
    );
    await queryRunner.query(`ALTER TABLE users RENAME COLUMN uuid_id TO id`);
    await queryRunner.query(`
      ALTER TABLE users
        MODIFY id CHAR(36) NOT NULL FIRST,
        ADD PRIMARY KEY (id)
    `);

    await this.addUserSystemRoleMappingUserForeignKeys(queryRunner);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await this.dropForeignKeysReferencingUsers(queryRunner);

    await queryRunner.query(
      `ALTER TABLE users ADD COLUMN numeric_id BIGINT UNSIGNED NULL`,
    );
    await queryRunner.query(`
      UPDATE users
        JOIN (
          SELECT id, ROW_NUMBER() OVER (ORDER BY created_at, id) AS row_number_id
          FROM users
        ) numbered ON numbered.id = users.id
        SET users.numeric_id = numbered.row_number_id
    `);

    await queryRunner.query(`
      ALTER TABLE user_system_role_mapping
        ADD COLUMN user_numeric_id BIGINT UNSIGNED NULL,
        ADD COLUMN granted_by_numeric_id BIGINT UNSIGNED NULL
    `);
    await queryRunner.query(`
      UPDATE user_system_role_mapping mapping
        JOIN users ON users.id = mapping.user_id
        SET mapping.user_numeric_id = users.numeric_id
    `);
    await queryRunner.query(`
      UPDATE user_system_role_mapping mapping
        JOIN users ON users.id = mapping.granted_by
        SET mapping.granted_by_numeric_id = users.numeric_id
    `);
    await queryRunner.query(`
      ALTER TABLE user_system_role_mapping
        DROP PRIMARY KEY,
        DROP COLUMN user_id,
        DROP COLUMN granted_by
    `);
    await queryRunner.query(`
      ALTER TABLE user_system_role_mapping
        RENAME COLUMN user_numeric_id TO user_id,
        RENAME COLUMN granted_by_numeric_id TO granted_by
    `);
    await queryRunner.query(`
      ALTER TABLE user_system_role_mapping
        MODIFY user_id BIGINT UNSIGNED NOT NULL FIRST,
        MODIFY granted_by BIGINT UNSIGNED NULL AFTER role_id,
        ADD PRIMARY KEY (user_id, role_id)
    `);

    await queryRunner.query(
      `ALTER TABLE users DROP PRIMARY KEY, DROP COLUMN id`,
    );
    await queryRunner.query(`ALTER TABLE users RENAME COLUMN numeric_id TO id`);
    await queryRunner.query(`
      ALTER TABLE users
        MODIFY id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT FIRST,
        ADD PRIMARY KEY (id)
    `);

    await this.addUserSystemRoleMappingUserForeignKeys(queryRunner);
  }

  private async dropForeignKeysReferencingUsers(
    queryRunner: QueryRunner,
  ): Promise<void> {
    const foreignKeys = (await queryRunner.query(`
      SELECT DISTINCT TABLE_NAME AS tableName, CONSTRAINT_NAME AS constraintName
      FROM information_schema.KEY_COLUMN_USAGE
      WHERE TABLE_SCHEMA = DATABASE() AND REFERENCED_TABLE_NAME = 'users'
    `)) as Array<{ tableName: string; constraintName: string }>;
    for (const { tableName, constraintName } of foreignKeys) {
      await queryRunner.query(
        `ALTER TABLE \`${tableName}\` DROP FOREIGN KEY \`${constraintName}\``,
      );
    }
  }

  private async addUserSystemRoleMappingUserForeignKeys(
    queryRunner: QueryRunner,
  ): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE user_system_role_mapping
        ADD CONSTRAINT fk_user_system_role_mapping_user FOREIGN KEY (user_id) REFERENCES users(id),
        ADD CONSTRAINT fk_user_system_role_mapping_granted_by FOREIGN KEY (granted_by) REFERENCES users(id)
    `);
  }
}
