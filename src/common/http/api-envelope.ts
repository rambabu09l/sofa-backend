export type PaginationMeta = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
};

export type ValidationIssue = {
  field: string;
  message: string;
};

export type ApiMetadata = {
  pagination: PaginationMeta | null;
  requestId: string | null;
  timestamp: string;
  path: string;
};

export type ApiError = {
  code: string;
  message: string;
  details: ValidationIssue[] | null;
};

export type ApiSuccessEnvelope<T> = {
  success: true;
  message: string;
  data: T | null;
  metadata: ApiMetadata;
};

export type ApiErrorEnvelope = {
  success: false;
  message: string;
  error: ApiError;
  data: null;
  metadata: ApiMetadata;
};

export type ApiEnvelope<T> = ApiSuccessEnvelope<T> | ApiErrorEnvelope;

export function buildSuccessEnvelope<T>(input: {
  data: T | null;
  message: string;
  pagination?: PaginationMeta | null;
  requestId?: string | null;
  path: string;
}): ApiSuccessEnvelope<T> {
  return {
    success: true,
    message: input.message,
    data: input.data,
    metadata: {
      pagination: input.pagination ?? null,
      requestId: input.requestId ?? null,
      timestamp: new Date().toISOString(),
      path: input.path,
    },
  };
}

export function buildErrorEnvelope(input: {
  error: string;
  code: string;
  path: string;
  requestId?: string | null;
  details?: ValidationIssue[] | null;
}): ApiErrorEnvelope {
  return {
    success: false,
    message: input.error,
    error: {
      code: input.code,
      message: input.error,
      details: input.details ?? null,
    },
    data: null,
    metadata: {
      pagination: null,
      requestId: input.requestId ?? null,
      timestamp: new Date().toISOString(),
      path: input.path,
    },
  };
}

export function buildPaginationMeta(input: {
  page: number;
  limit: number;
  total: number;
}): PaginationMeta {
  const page = Math.max(1, input.page);
  const limit = Math.max(1, input.limit);
  const total = Math.max(0, input.total);
  const totalPages = Math.max(1, Math.ceil(total / limit) || 1);

  return {
    page,
    limit,
    total,
    totalPages,
    hasNextPage: page < totalPages,
    hasPreviousPage: page > 1,
  };
}
