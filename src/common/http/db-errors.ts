import { QueryFailedError } from 'typeorm';

const MYSQL_ROW_IS_REFERENCED = 1451;

/** True when a delete failed because another row still references this one. */
export function isRowReferencedError(error: unknown): boolean {
  if (!(error instanceof QueryFailedError)) return false;
  const errno = (error.driverError as { errno?: number } | undefined)?.errno;
  return errno === MYSQL_ROW_IS_REFERENCED;
}
