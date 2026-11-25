const DELETED_CODE_PREFIX = 'DEL_';

/**
 * Code given to a soft-deleted catalog row (priority, ticket type) so its
 * original code is free again; the unique keys on `code` also count deleted rows.
 * Built from the row id so it stays unique, and fits VARCHAR(40) for UUID
 * (36 characters) and numeric ids.
 */
export function toDeletedCode(rowId: string): string {
  return `${DELETED_CODE_PREFIX}${rowId}`;
}
