import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response, NextFunction, ErrorRequestHandler } from 'express';
import { PinoLogger } from 'nestjs-pino';
import SuperTokens from 'supertokens-node';
import { errorHandler as superTokensErrorHandler } from 'supertokens-node/framework/express';
import { QueryFailedError } from 'typeorm';
import { EnvService } from '../../config/env.service';
import { buildErrorEnvelope, type ValidationIssue } from '../http/api-envelope';
import {
  ErrorCode,
  HttpUserMessage,
  defaultErrorForStatus,
  isGenericHttpMessage,
} from '../http/http-messages';
import { UserFacingInternalError } from '../http/service-error';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly superTokensHandler: ErrorRequestHandler =
    superTokensErrorHandler();

  constructor(
    private readonly logger: PinoLogger,
    private readonly env: EnvService,
  ) {
    this.logger.setContext(AllExceptionsFilter.name);
  }

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    // TRY_REFRESH_TOKEN / UNAUTHORISED must stay SuperTokens-shaped 401s.
    // Turning them into our 500 envelope breaks FE session refresh.
    if (SuperTokens.Error.isErrorFromSuperTokens(exception)) {
      this.superTokensHandler(
        exception,
        request,
        response,
        ctx.getNext<NextFunction>(),
      );
      return;
    }

    const normalized = this.normalize(exception);
    const requestId = this.readRequestId(request);

    if (normalized.statusCode >= 500) {
      this.logger.error(
        { err: exception, requestId, path: request.originalUrl },
        normalized.error,
      );
    } else {
      this.logger.warn(
        {
          requestId,
          path: request.originalUrl,
          statusCode: normalized.statusCode,
        },
        normalized.error,
      );
    }

    const body = buildErrorEnvelope({
      error: normalized.error,
      code: normalized.code,
      path: request.originalUrl,
      requestId,
      details: normalized.details,
    });

    response.status(normalized.statusCode).json(body);
  }

  private normalize(exception: unknown): {
    statusCode: number;
    code: string;
    error: string;
    details: ValidationIssue[] | null;
  } {
    if (exception instanceof HttpException) {
      const statusCode = exception.getStatus();
      const payload = exception.getResponse();
      const parsed = this.parseHttpPayload(payload, exception.message);
      const fallback = defaultErrorForStatus(statusCode);
      const error =
        statusCode >= 500 &&
        this.env.isProduction &&
        !(exception instanceof UserFacingInternalError)
          ? fallback.message
          : isGenericHttpMessage(parsed.message)
            ? fallback.message
            : parsed.message;

      return {
        statusCode,
        code: parsed.code ?? fallback.code,
        error,
        details: parsed.details,
      };
    }

    if (exception instanceof QueryFailedError) {
      const errno = (exception.driverError as { errno?: number } | undefined)
        ?.errno;
      if (errno === 1062) {
        return {
          statusCode: HttpStatus.CONFLICT,
          code: ErrorCode.CONFLICT,
          error: HttpUserMessage.CONFLICT,
          details: null,
        };
      }

      return {
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        code: ErrorCode.DATABASE_ERROR,
        error: this.env.isProduction
          ? HttpUserMessage.DATABASE
          : exception.message,
        details: null,
      };
    }

    if (exception instanceof Error) {
      return {
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        code: ErrorCode.INTERNAL_ERROR,
        error: this.env.isProduction
          ? HttpUserMessage.INTERNAL
          : exception.message,
        details: null,
      };
    }

    return {
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      code: ErrorCode.INTERNAL_ERROR,
      error: HttpUserMessage.INTERNAL,
      details: null,
    };
  }

  private parseHttpPayload(
    payload: string | object,
    fallback: string,
  ): {
    message: string;
    code?: string;
    details: ValidationIssue[] | null;
  } {
    if (typeof payload === 'string') {
      return { message: payload, details: null };
    }

    if (!payload || typeof payload !== 'object') {
      return { message: fallback, details: null };
    }

    const record = payload as {
      message?: unknown;
      code?: unknown;
      details?: unknown;
    };

    const details = Array.isArray(record.details)
      ? record.details.filter(
          (item): item is ValidationIssue =>
            typeof item === 'object' &&
            item !== null &&
            typeof (item as ValidationIssue).field === 'string' &&
            typeof (item as ValidationIssue).message === 'string',
        )
      : null;

    let message = fallback;
    if (typeof record.message === 'string' && record.message.length > 0) {
      message = record.message;
    } else if (Array.isArray(record.message)) {
      const joined = record.message
        .filter((item) => typeof item === 'string')
        .join('; ');
      if (joined.length > 0) {
        message = joined;
      }
    }

    return {
      message,
      code: typeof record.code === 'string' ? record.code : undefined,
      details: details && details.length > 0 ? details : null,
    };
  }

  private readRequestId(request: Request): string | undefined {
    const header = request.header('x-request-id');
    if (header) {
      return header;
    }

    const id = (request as Request & { id?: string }).id;
    return typeof id === 'string' ? id : undefined;
  }
}
