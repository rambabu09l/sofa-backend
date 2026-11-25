import {
  CopyObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
  HeadBucketCommand,
  HeadObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import type {
  ObjectHead,
  PresignGetInput,
  PresignPutInput,
} from './types/storage.types';

export type S3StorageClientConfig = {
  endpoint: string;
  region: string;
  accessKeyId: string;
  secretAccessKey: string;
  bucket: string;
  forcePathStyle: boolean;
};

export function createS3Client(config: S3StorageClientConfig): S3Client {
  return new S3Client({
    endpoint: config.endpoint,
    region: config.region,
    credentials: {
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey,
    },
    forcePathStyle: config.forcePathStyle,
  });
}

export async function s3Ping(client: S3Client, bucket: string): Promise<void> {
  await client.send(new HeadBucketCommand({ Bucket: bucket }));
}

export async function s3PresignPut(
  client: S3Client,
  bucket: string,
  input: PresignPutInput,
): Promise<string> {
  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: input.key,
    ContentType: input.contentType,
  });
  return getSignedUrl(client, command, { expiresIn: input.expiresSeconds });
}

export async function s3PresignGet(
  client: S3Client,
  bucket: string,
  input: PresignGetInput,
): Promise<string> {
  const command = new GetObjectCommand({
    Bucket: bucket,
    Key: input.key,
    ...(input.fileName
      ? {
          ResponseContentDisposition: `attachment; filename="${input.fileName.replace(/"/g, '')}"`,
        }
      : {}),
  });
  return getSignedUrl(client, command, { expiresIn: input.expiresSeconds });
}

export async function s3HeadObject(
  client: S3Client,
  bucket: string,
  key: string,
): Promise<ObjectHead | null> {
  try {
    const result = await client.send(
      new HeadObjectCommand({ Bucket: bucket, Key: key }),
    );
    return {
      contentLength: result.ContentLength ?? 0,
      contentType: result.ContentType ?? null,
      etag: result.ETag ?? null,
    };
  } catch (error: unknown) {
    const name =
      error && typeof error === 'object' && 'name' in error
        ? String((error as { name: string }).name)
        : '';
    const status =
      error && typeof error === 'object' && '$metadata' in error
        ? (error as { $metadata?: { httpStatusCode?: number } }).$metadata
            ?.httpStatusCode
        : undefined;
    if (name === 'NotFound' || name === 'NoSuchKey' || status === 404) {
      return null;
    }
    throw error;
  }
}

export async function s3GetObjectBuffer(
  client: S3Client,
  bucket: string,
  key: string,
): Promise<Buffer> {
  const result = await client.send(
    new GetObjectCommand({ Bucket: bucket, Key: key }),
  );
  const body = result.Body;
  if (!body) {
    throw new Error(`Object body was empty for key ${key}`);
  }
  const bytes = await body.transformToByteArray();
  return Buffer.from(bytes);
}

export async function s3CopyObject(
  client: S3Client,
  bucket: string,
  sourceKey: string,
  destinationKey: string,
): Promise<void> {
  await client.send(
    new CopyObjectCommand({
      Bucket: bucket,
      CopySource: `${bucket}/${encodeURIComponent(sourceKey).replace(/%2F/g, '/')}`,
      Key: destinationKey,
    }),
  );
}

export async function s3DeleteObject(
  client: S3Client,
  bucket: string,
  key: string,
): Promise<void> {
  await client.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
}
