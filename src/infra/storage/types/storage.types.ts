export type PresignPutInput = {
  key: string;
  contentType: string;
  expiresSeconds: number;
};

export type PresignGetInput = {
  key: string;
  expiresSeconds: number;
  fileName?: string;
};

export type ObjectHead = {
  contentLength: number;
  contentType: string | null;
  etag: string | null;
};
