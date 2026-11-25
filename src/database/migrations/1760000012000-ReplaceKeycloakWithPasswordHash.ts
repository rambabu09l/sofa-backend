import { MigrationInterface, QueryRunner } from 'typeorm';

export class ReplaceKeycloakWithPasswordHash1760000012000
  implements MigrationInterface
{
  name = 'ReplaceKeycloakWithPasswordHash1760000012000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const hasPasswordHash = await this.hasColumn(
      queryRunner,
      'users',
      'password_hash',
    );
    if (!hasPasswordHash) {
      await queryRunner.query(`
        ALTER TABLE users
          ADD COLUMN password_hash VARCHAR(255) NULL AFTER id
      `);
    }

    const hasKeycloakId = await this.hasColumn(
      queryRunner,
      'users',
      'keycloak_id',
    );
    if (hasKeycloakId) {
      // Dropping the column also drops its unique index (name varies by environment).
      await queryRunner.query(`
        ALTER TABLE users
          DROP COLUMN keycloak_id
      `);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const hasKeycloakId = await this.hasColumn(
      queryRunner,
      'users',
      'keycloak_id',
    );
    if (!hasKeycloakId) {
      await queryRunner.query(`
        ALTER TABLE users
          ADD COLUMN keycloak_id VARCHAR(191) NULL AFTER id
      `);
      await queryRunner.query(`
        UPDATE users
        SET keycloak_id = id
        WHERE keycloak_id IS NULL
      `);
      await queryRunner.query(`
        ALTER TABLE users
          MODIFY COLUMN keycloak_id VARCHAR(191) NOT NULL,
          ADD UNIQUE INDEX IDX_users_keycloak_id (keycloak_id)
      `);
    }

    const hasPasswordHash = await this.hasColumn(
      queryRunner,
      'users',
      'password_hash',
    );
    if (hasPasswordHash) {
      await queryRunner.query(`
        ALTER TABLE users
          DROP COLUMN password_hash
      `);
    }
  }

  private async hasColumn(
    queryRunner: QueryRunner,
    table: string,
    column: string,
  ): Promise<boolean> {
    const rows = (await queryRunner.query(
      `
        SELECT 1 AS present
        FROM information_schema.columns
        WHERE table_schema = DATABASE()
          AND table_name = ?
          AND column_name = ?
        LIMIT 1
      `,
      [table, column],
    )) as Array<{ present: number }>;
    return rows.length > 0;
  }
}
