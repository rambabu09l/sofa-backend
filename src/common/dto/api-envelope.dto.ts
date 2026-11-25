import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class PaginationMetaDto {
  @ApiProperty({ example: 1, description: 'Current page number, 1-based.' })
  page!: number;

  @ApiProperty({
    example: 20,
    description: 'Maximum number of items returned per page.',
  })
  limit!: number;

  @ApiProperty({
    example: 42,
    description: 'Total number of items across all pages.',
  })
  total!: number;

  @ApiProperty({
    example: 3,
    description: 'Total number of pages; at least 1 even when empty.',
  })
  totalPages!: number;

  @ApiProperty({
    example: true,
    description: 'True when a page after the current one exists.',
  })
  hasNextPage!: boolean;

  @ApiProperty({
    example: false,
    description: 'True when the current page is not the first page.',
  })
  hasPreviousPage!: boolean;
}

export class ValidationIssueDto {
  @ApiProperty({
    example: 'code',
    description: 'Request field that failed validation.',
  })
  field!: string;

  @ApiProperty({
    example: 'code must be unique',
    description: 'User-facing validation message for the field.',
  })
  message!: string;
}

export class ApiMetadataDto {
  @ApiProperty({
    type: PaginationMetaDto,
    nullable: true,
    description: 'Present for paginated list endpoints; otherwise null',
  })
  pagination!: PaginationMetaDto | null;

  @ApiProperty({
    nullable: true,
    example: 'b3c1f2a4-8d21-4c9a-9e11-1f0a2b3c4d5e',
    description:
      'Request id from the x-request-id header (generated when absent); null if unavailable.',
  })
  requestId!: string | null;

  @ApiProperty({
    example: '2026-09-07T07:30:00.000Z',
    description: 'ISO-8601 time the response was built.',
  })
  timestamp!: string;

  @ApiProperty({
    example: '/api/v1/masters/roles',
    description: 'Original request URL path, including any query string.',
  })
  path!: string;
}

export class ApiErrorDto {
  @ApiProperty({
    example: 'UNAUTHORIZED',
    description: 'Stable machine-readable error code.',
  })
  code!: string;

  @ApiProperty({
    example: 'Please sign in to continue',
    description: 'User-facing error copy from the backend.',
  })
  message!: string;

  @ApiPropertyOptional({
    type: [ValidationIssueDto],
    nullable: true,
    description: 'Field-level validation issues when code is VALIDATION_ERROR',
  })
  details!: ValidationIssueDto[] | null;
}

export class ApiSuccessEnvelopeDto {
  @ApiProperty({
    example: true,
    description: 'Always true for successful responses.',
  })
  success!: true;

  @ApiProperty({
    example: 'Retrieved successfully',
    description:
      'Backend-owned user-facing copy. SPA must display this, not invent toasts.',
  })
  message!: string;

  @ApiProperty({
    description: 'Endpoint payload; null only when there is no body',
    type: Object,
  })
  data: unknown;

  @ApiProperty({
    type: ApiMetadataDto,
    description: 'Response metadata: pagination and request details.',
  })
  metadata!: ApiMetadataDto;
}

export class ApiErrorEnvelopeDto {
  @ApiProperty({
    example: false,
    description: 'Always false for error responses.',
  })
  success!: false;

  @ApiProperty({
    example: 'Please sign in to continue',
    description: 'User-facing error copy; same as error.message.',
  })
  message!: string;

  @ApiProperty({
    type: ApiErrorDto,
    description: 'Error code, message and validation details.',
  })
  error!: ApiErrorDto;

  @ApiProperty({
    nullable: true,
    example: null,
    type: Object,
    description: 'Always null on error',
  })
  data!: null;

  @ApiProperty({
    type: ApiMetadataDto,
    description: 'Response metadata: pagination and request details.',
  })
  metadata!: ApiMetadataDto;
}
