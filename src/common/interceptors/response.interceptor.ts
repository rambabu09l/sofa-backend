import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { Observable, map } from 'rxjs';
import { API_MESSAGE_KEY } from '../decorators/api-message.decorator';
import { RAW_RESPONSE_KEY } from '../decorators/raw-response.decorator';
import { buildSuccessEnvelope, type ApiEnvelope } from '../http/api-envelope';
import { defaultSuccessMessage } from '../http/http-messages';
import { isPaginatedResult } from '../http/paginated';

@Injectable()
export class ResponseInterceptor<T> implements NestInterceptor<
  T,
  T | ApiEnvelope<unknown>
> {
  constructor(private readonly reflector: Reflector) {}

  intercept(
    context: ExecutionContext,
    next: CallHandler<T>,
  ): Observable<T | ApiEnvelope<unknown>> {
    const isRaw = this.reflector.getAllAndOverride<boolean>(RAW_RESPONSE_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isRaw) {
      return next.handle();
    }

    const request = context.switchToHttp().getRequest<Request>();
    const message =
      this.reflector.getAllAndOverride<string>(API_MESSAGE_KEY, [
        context.getHandler(),
        context.getClass(),
      ]) ?? defaultSuccessMessage(request.method);

    return next.handle().pipe(
      map((payload) => {
        if (isPaginatedResult(payload)) {
          return buildSuccessEnvelope({
            data: payload.items,
            message,
            pagination: payload.pagination,
            requestId: readRequestId(request),
            path: request.originalUrl,
          });
        }

        return buildSuccessEnvelope({
          data: payload === undefined ? null : payload,
          message,
          requestId: readRequestId(request),
          path: request.originalUrl,
        });
      }),
    );
  }
}

function readRequestId(request: Request): string | null {
  const header = request.header('x-request-id');
  if (header) {
    return header;
  }

  const id = (request as Request & { id?: string }).id;
  return typeof id === 'string' ? id : null;
}
