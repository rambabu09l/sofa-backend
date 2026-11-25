import { applyDecorators, type Type } from '@nestjs/common';
import {
  ApiCreatedResponse,
  ApiExtraModels,
  ApiOkResponse,
  getSchemaPath,
} from '@nestjs/swagger';
import { ApiSuccessEnvelopeDto } from '../dto/api-envelope.dto';

function envelopeSchema(model: Type<unknown>, isArray: boolean) {
  return {
    allOf: [
      { $ref: getSchemaPath(ApiSuccessEnvelopeDto) },
      {
        properties: {
          success: { type: 'boolean', enum: [true] },
          data: isArray
            ? { type: 'array', items: { $ref: getSchemaPath(model) } }
            : { $ref: getSchemaPath(model) },
        },
      },
    ],
  };
}

export function ApiOkEnvelope(model: Type<unknown>, isArray = false) {
  return applyDecorators(
    ApiExtraModels(ApiSuccessEnvelopeDto, model),
    ApiOkResponse({ schema: envelopeSchema(model, isArray) }),
  );
}

export function ApiOkEmptyEnvelope() {
  return applyDecorators(
    ApiExtraModels(ApiSuccessEnvelopeDto),
    ApiOkResponse({
      schema: {
        allOf: [
          { $ref: getSchemaPath(ApiSuccessEnvelopeDto) },
          {
            properties: {
              success: { type: 'boolean', enum: [true] },
              data: { type: 'object', nullable: true, example: null },
            },
          },
        ],
      },
    }),
  );
}

export function ApiCreatedEnvelope(model: Type<unknown>) {
  return applyDecorators(
    ApiExtraModels(ApiSuccessEnvelopeDto, model),
    ApiCreatedResponse({ schema: envelopeSchema(model, false) }),
  );
}
