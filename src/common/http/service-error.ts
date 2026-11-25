import { HttpException, InternalServerErrorException } from '@nestjs/common';
import { QueryFailedError } from 'typeorm';

type ServiceErrorLogger = {
  error(message: string, ...rest: unknown[]): unknown;
};

/**
 * 500 whose message was written by us for the user, so the exception filter
 * shows it in production instead of the generic fallback.
 */
export class UserFacingInternalError extends InternalServerErrorException {}

export function rethrowServiceError(
  error: unknown,
  logger: ServiceErrorLogger,
  context: string,
  message: string,
): never {
  if (error instanceof HttpException || error instanceof QueryFailedError) {
    throw error;
  }

  const stack = error instanceof Error ? error.stack : String(error);
  logger.error(`${context} failed`, stack);
  throw new UserFacingInternalError(message);
}
