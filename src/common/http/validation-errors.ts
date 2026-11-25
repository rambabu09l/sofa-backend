import { ValidationError } from 'class-validator';
import type { ValidationIssue } from './api-envelope';

export function flattenValidationErrors(
  errors: ValidationError[],
  parent = '',
): ValidationIssue[] {
  return errors.flatMap((error) => {
    const field = parent ? `${parent}.${error.property}` : error.property;
    const constraints = Object.values(error.constraints ?? {});
    const current = constraints.map((message) => ({ field, message }));
    const nested = error.children?.length
      ? flattenValidationErrors(error.children, field)
      : [];
    return [...current, ...nested];
  });
}
