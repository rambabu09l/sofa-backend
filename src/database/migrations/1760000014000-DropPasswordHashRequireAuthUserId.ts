import { MigrationInterface, QueryRunner } from 'typeorm';

export class DropPasswordHashRequireAuthUserId1760000014000
  implements MigrationInterface
{
  name = 'DropPasswordHashRequireAuthUserId1760000014000';

  public async up(queryRunner: QueryRunner): Promise<void> {
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

    // Keep auth_user_id nullable while legacy rows without a SuperTokens link remain.
    // New signups always set auth_user_id; requireByAuthUserId rejects unlinked accounts.
    const nullCountRows: Array<{ count: number | string }> =
      await queryRunner.query(`
        SELECT COUNT(*) AS count
        FROM users
        WHERE auth_user_id IS NULL
      `);
    const nullCount = Number(nullCountRows[0]?.count ?? 0);
    const nullable = await this.isNullable(queryRunner, 'users', 'auth_user_id');

    if (nullCount === 0 && nullable) {
      await queryRunner.query(`
        ALTER TABLE users
          MODIFY COLUMN auth_user_id VARCHAR(128) NOT NULL
      `);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const nullable = await this.isNullable(queryRunner, 'users', 'auth_user_id');
    if (!nullable) {
      await queryRunner.query(`
        ALTER TABLE users
          MODIFY COLUMN auth_user_id VARCHAR(128) NULL
      `);
    }

    const hasPasswordHash = await this.hasColumn(
      queryRunner,
      'users',
      'password_hash',
    );
    if (!hasPasswordHash) {
      await queryRunner.query(`
        ALTER TABLE users
          ADD COLUMN password_hash VARCHAR(255) NULL AFTER auth_user_id
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

  private async isNullable(
    queryRunner: QueryRunner,
    table: string,
    column: string,
  ): Promise<boolean> {
    const rows: Array<{ Null: string }> = await queryRunner.query(
      `SHOW COLUMNS FROM \`${table}\` LIKE ?`,
      [column],
    );
    return rows[0]?.Null === 'YES';
  }
}
