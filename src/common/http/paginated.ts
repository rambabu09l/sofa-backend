import { buildPaginationMeta, type PaginationMeta } from './api-envelope';

const PAGINATED_KIND = Symbol.for('sofa.paginated');

export type PaginatedResult<T> = {
  readonly kind: typeof PAGINATED_KIND;
  items: T[];
  pagination: PaginationMeta;
};

export function paginated<T>(
  items: T[],
  input: { page: number; limit: number; total: number },
): PaginatedResult<T> {
  return {
    kind: PAGINATED_KIND,
    items,
    pagination: buildPaginationMeta(input),
  };
}

export function isPaginatedResult(
  value: unknown,
): value is PaginatedResult<unknown> {
  return (
    typeof value === 'object' &&
    value !== null &&
    'kind' in value &&
    (value as PaginatedResult<unknown>).kind === PAGINATED_KIND
  );
}
