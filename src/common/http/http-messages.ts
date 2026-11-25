export const ErrorCode = {
  UNAUTHENTICATED: 'UNAUTHENTICATED',
  INVALID_TOKEN: 'INVALID_TOKEN',
  FORBIDDEN: 'FORBIDDEN',
  NOT_FOUND: 'NOT_FOUND',
  CONFLICT: 'CONFLICT',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  RATE_LIMITED: 'RATE_LIMITED',
  DATABASE_ERROR: 'DATABASE_ERROR',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
} as const;

export type ErrorCode = (typeof ErrorCode)[keyof typeof ErrorCode];

export const HttpUserMessage = {
  UNAUTHENTICATED: 'Please sign in to continue',
  INVALID_TOKEN: 'Your session is invalid or has expired',
  FORBIDDEN: 'You do not have permission to perform this action',
  NOT_FOUND: 'The requested resource was not found',
  CONFLICT: 'A record with that value already exists',
  VALIDATION: 'Please fix the highlighted fields and try again',
  RATE_LIMITED: 'Too many requests. Please try again shortly',
  DATABASE: 'A database error occurred',
  INTERNAL: 'Something went wrong. Please try again',
  CREATED: 'Created successfully',
  UPDATED: 'Updated successfully',
  DELETED: 'Deleted successfully',
  RETRIEVED: 'Retrieved successfully',
} as const;

export function defaultSuccessMessage(method: string): string {
  switch (method.toUpperCase()) {
    case 'POST':
      return HttpUserMessage.CREATED;
    case 'PUT':
    case 'PATCH':
      return HttpUserMessage.UPDATED;
    case 'DELETE':
      return HttpUserMessage.DELETED;
    default:
      return HttpUserMessage.RETRIEVED;
  }
}

export function defaultErrorForStatus(statusCode: number): {
  code: ErrorCode;
  message: string;
} {
  if (statusCode === 401) {
    return {
      code: ErrorCode.UNAUTHENTICATED,
      message: HttpUserMessage.UNAUTHENTICATED,
    };
  }
  if (statusCode === 403) {
    return { code: ErrorCode.FORBIDDEN, message: HttpUserMessage.FORBIDDEN };
  }
  if (statusCode === 404) {
    return { code: ErrorCode.NOT_FOUND, message: HttpUserMessage.NOT_FOUND };
  }
  if (statusCode === 409) {
    return { code: ErrorCode.CONFLICT, message: HttpUserMessage.CONFLICT };
  }
  if (statusCode === 429) {
    return {
      code: ErrorCode.RATE_LIMITED,
      message: HttpUserMessage.RATE_LIMITED,
    };
  }
  if (statusCode >= 500) {
    return {
      code: ErrorCode.INTERNAL_ERROR,
      message: HttpUserMessage.INTERNAL,
    };
  }
  return {
    code: ErrorCode.VALIDATION_ERROR,
    message: HttpUserMessage.VALIDATION,
  };
}

const NEST_GENERIC_MESSAGES = new Set([
  'Unauthorized',
  'Forbidden',
  'Not Found',
  'Bad Request',
  'Conflict',
  'Internal Server Error',
  'Too Many Requests',
  'ThrottlerException: Too Many Requests',
]);

export function isGenericHttpMessage(message: string): boolean {
  return NEST_GENERIC_MESSAGES.has(message);
}
