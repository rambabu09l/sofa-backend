import { MigrationInterface, QueryRunner } from 'typeorm';

type TimestampColumn = 'created_at' | 'updated_at' | 'deleted_at';

const TIMESTAMP_COLUMN_DEFINITIONS: Record<TimestampColumn, string> = {
  created_at: 'DATETIME(3) NULL DEFAULT CURRENT_TIMESTAMP(3)',
  updated_at:
    'DATETIME(3) NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)',
  deleted_at: 'DATETIME(3) NULL',
};

const PREVIOUS_TIMESTAMP_COLUMN_DEFINITIONS: Record<TimestampColumn, string> = {
  created_at: 'DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3)',
  updated_at:
    'DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)',
  deleted_at: 'DATETIME(3) NULL',
};

const AUDIT_USER_COLUMNS = ['created_by', 'updated_by', 'deleted_by'];

/** Timestamp columns each table already had before this migration. */
const EXISTING_TIMESTAMP_COLUMNS_BY_TABLE: Record<string, TimestampColumn[]> = {
  users: ['created_at', 'updated_at', 'deleted_at'],
  master_roles: ['created_at', 'updated_at', 'deleted_at'],
  master_permissions: ['created_at', 'updated_at', 'deleted_at'],
  master_menu: ['created_at', 'updated_at', 'deleted_at'],
  master_ticket_types: ['created_at', 'updated_at', 'deleted_at'],
  master_ticket_priorities: ['created_at', 'updated_at', 'deleted_at'],
  role_permission_mapping: [],
  role_menu_mapping: [],
  user_system_role_mapping: [],
};

const ALL_TIMESTAMP_COLUMNS: TimestampColumn[] = [
  'created_at',
  'updated_at',
  'deleted_at',
];

export class AddAuditColumnsToAllTables1760000004000 implements MigrationInterface {
  name = 'AddAuditColumnsToAllTables1760000004000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    for (const table of Object.keys(EXISTING_TIMESTAMP_COLUMNS_BY_TABLE)) {
      if (!(await this.tableExists(queryRunner, table))) {
        continue;
      }
      const present = await this.getExistingColumnNames(queryRunner, table);
      const alterations: string[] = [];

      for (const column of ALL_TIMESTAMP_COLUMNS) {
        if (present.has(column)) {
          alterations.push(
            `MODIFY ${column} ${TIMESTAMP_COLUMN_DEFINITIONS[column]}`,
          );
        } else {
          alterations.push(
            `ADD COLUMN ${column} ${TIMESTAMP_COLUMN_DEFINITIONS[column]}`,
          );
        }
      }

      for (const column of AUDIT_USER_COLUMNS) {
        if (!present.has(column)) {
          alterations.push(`ADD COLUMN ${column} CHAR(36) NULL`);
        }
      }

      if (alterations.length === 0) {
        continue;
      }

      await queryRunner.query(
        `ALTER TABLE \`${table}\` ${alterations.join(', ')}`,
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    for (const [table, existingColumns] of Object.entries(
      EXISTING_TIMESTAMP_COLUMNS_BY_TABLE,
    )) {
      if (!(await this.tableExists(queryRunner, table))) {
        continue;
      }
      const present = await this.getExistingColumnNames(queryRunner, table);
      const restoredNotNullColumns = existingColumns.filter(
        (column) => column !== 'deleted_at' && present.has(column),
      );
      if (restoredNotNullColumns.length > 0) {
        await queryRunner.query(
          `UPDATE \`${table}\` SET ${restoredNotNullColumns
            .map((column) => `${column} = COALESCE(${column}, CURRENT_TIMESTAMP(3))`)
            .join(', ')}`,
        );
      }

      const alterations: string[] = [];
      for (const column of AUDIT_USER_COLUMNS) {
        if (present.has(column)) {
          alterations.push(`DROP COLUMN ${column}`);
        }
      }
      for (const column of ALL_TIMESTAMP_COLUMNS) {
        if (!present.has(column)) {
          continue;
        }
        alterations.push(
          existingColumns.includes(column)
            ? `MODIFY ${column} ${PREVIOUS_TIMESTAMP_COLUMN_DEFINITIONS[column]}`
            : `DROP COLUMN ${column}`,
        );
      }
      if (alterations.length === 0) {
        continue;
      }
      await queryRunner.query(
        `ALTER TABLE \`${table}\` ${alterations.join(', ')}`,
      );
    }
  }

  private async tableExists(
    queryRunner: QueryRunner,
    table: string,
  ): Promise<boolean> {
    const rows = (await queryRunner.query(
      `
      SELECT TABLE_NAME AS tableName
      FROM information_schema.TABLES
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = ?
      `,
      [table],
    )) as unknown[];
    return rows.length > 0;
  }

  private async getExistingColumnNames(
    queryRunner: QueryRunner,
    table: string,
  ): Promise<Set<string>> {
    const rows = (await queryRunner.query(
      `
      SELECT COLUMN_NAME AS columnName
      FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = ?
      `,
      [table],
    )) as Array<{ columnName: string }>;

    return new Set(rows.map((row) => row.columnName));
  }
}
