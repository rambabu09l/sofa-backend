import { applyDecorators, HttpStatus } from '@nestjs/common';
import { ApiExtraModels, ApiResponse } from '@nestjs/swagger';
import { ApiErrorEnvelopeDto } from '../dto/api-envelope.dto';

export type ApiErrorResponse = {
  status: HttpStatus;
  description: string;
};

/** Documents the error statuses an endpoint's service can throw, using the standard error envelope. */
export function ApiErrorResponses(...responses: ApiErrorResponse[]) {
  return applyDecorators(
    ApiExtraModels(ApiErrorEnvelopeDto),
    ...responses.map(({ status, description }) =>
      ApiResponse({ status, description, type: ApiErrorEnvelopeDto }),
    ),
  );
}
