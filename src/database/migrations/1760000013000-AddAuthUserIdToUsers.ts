import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddAuthUserIdToUsers1760000013000 implements MigrationInterface {
  name = 'AddAuthUserIdToUsers1760000013000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const hasAuthUserId = await this.hasColumn(
      queryRunner,
      'users',
      'auth_user_id',
    );
    if (!hasAuthUserId) {
      await queryRunner.query(`
        ALTER TABLE users
          ADD COLUMN auth_user_id VARCHAR(128) NULL AFTER id
      `);
      await queryRunner.query(`
        CREATE UNIQUE INDEX IDX_users_auth_user_id ON users (auth_user_id)
      `);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const hasAuthUserId = await this.hasColumn(
      queryRunner,
      'users',
      'auth_user_id',
    );
    if (hasAuthUserId) {
      await queryRunner.query(`
        DROP INDEX IDX_users_auth_user_id ON users
      `);
      await queryRunner.query(`
        ALTER TABLE users
          DROP COLUMN auth_user_id
      `);
    }
  }

  private async hasColumn(
    queryRunner: QueryRunner,
    table: string,
    column: string,
  ): Promise<boolean> {
    const rows: Array<{ Field: string }> = await queryRunner.query(
      `SHOW COLUMNS FROM \`${table}\` LIKE ?`,
      [column],
    );
    return rows.length > 0;
  }
}
