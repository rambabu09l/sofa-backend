import { applyDecorators } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiExtraModels,
  ApiForbiddenResponse,
  ApiOAuth2,
  ApiTooManyRequestsResponse,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { SWAGGER_BEARER_AUTH } from '../constants/swagger';
import { ApiErrorEnvelopeDto } from '../dto/api-envelope.dto';

export function ApiRateLimited() {
  return applyDecorators(
    ApiExtraModels(ApiErrorEnvelopeDto),
    ApiTooManyRequestsResponse({
      description: 'Rate limit exceeded',
      type: ApiErrorEnvelopeDto,
    }),
  );
}

export function ApiAuth() {
  return applyDecorators(
    ApiBearerAuth(SWAGGER_BEARER_AUTH),
    ApiUnauthorizedResponse({
      description: 'Missing, expired, or invalid access token',
      type: ApiErrorEnvelopeDto,
    }),
    ApiForbiddenResponse({
      description: 'Authenticated but not allowed for this resource',
      type: ApiErrorEnvelopeDto,
    }),
    ApiRateLimited(),
  );
}
