import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import type { S3Client } from '@aws-sdk/client-s3';
import { rethrowServiceError } from '../../common/http/service-error';
import { EnvService } from '../../config/env.service';
import {
  createS3Client,
  s3CopyObject,
  s3DeleteObject,
  s3GetObjectBuffer,
  s3HeadObject,
  s3Ping,
  s3PresignGet,
  s3PresignPut,
} from './s3-storage.client';
import type {
  ObjectHead,
  PresignGetInput,
  PresignPutInput,
} from './types/storage.types';

@Injectable()
export class StorageService implements OnModuleDestroy {
  private readonly logger = new Logger(StorageService.name);
  private readonly client: S3Client;
  private readonly bucket: string;

  constructor(private readonly env: EnvService) {
    this.bucket = this.env.get('S3_BUCKET');
    this.client = createS3Client({
      endpoint: this.env.get('S3_ENDPOINT'),
      region: this.env.get('S3_REGION'),
      accessKeyId: this.env.get('S3_ACCESS_KEY'),
      secretAccessKey: this.env.get('S3_SECRET_KEY'),
      bucket: this.bucket,
      forcePathStyle: this.env.get('S3_FORCE_PATH_STYLE'),
    });
  }

  onModuleDestroy(): void {
    this.client.destroy();
  }

  async ping(): Promise<void> {
    try {
      await s3Ping(this.client, this.bucket);
    } catch (error) {
      rethrowServiceError(
        error,
        this.logger,
        'StorageService.ping',
        'Could not reach object storage',
      );
    }
  }

  async presignPut(input: PresignPutInput): Promise<string> {
    try {
      return await s3PresignPut(this.client, this.bucket, input);
    } catch (error) {
      rethrowServiceError(
        error,
        this.logger,
        `StorageService.presignPut key=${input.key}`,
        'Could not create the upload URL',
      );
    }
  }

  async presignGet(input: PresignGetInput): Promise<string> {
    try {
      return await s3PresignGet(this.client, this.bucket, input);
    } catch (error) {
      rethrowServiceError(
        error,
        this.logger,
        `StorageService.presignGet key=${input.key}`,
        'Could not create the download URL',
      );
    }
  }

  async headObject(key: string): Promise<ObjectHead | null> {
    try {
      return await s3HeadObject(this.client, this.bucket, key);
    } catch (error) {
      rethrowServiceError(
        error,
        this.logger,
        `StorageService.headObject key=${key}`,
        'Could not check the uploaded file',
      );
    }
  }

  async getObjectBuffer(key: string): Promise<Buffer> {
    try {
      return await s3GetObjectBuffer(this.client, this.bucket, key);
    } catch (error) {
      rethrowServiceError(
        error,
        this.logger,
        `StorageService.getObjectBuffer key=${key}`,
        'Could not read the uploaded file',
      );
    }
  }

  async copyObject(sourceKey: string, destinationKey: string): Promise<void> {
    try {
      await s3CopyObject(this.client, this.bucket, sourceKey, destinationKey);
    } catch (error) {
      rethrowServiceError(
        error,
        this.logger,
        `StorageService.copyObject from=${sourceKey} to=${destinationKey}`,
        'Could not move the file in storage',
      );
    }
  }

  async deleteObject(key: string): Promise<void> {
    try {
      await s3DeleteObject(this.client, this.bucket, key);
    } catch (error) {
      rethrowServiceError(
        error,
        this.logger,
        `StorageService.deleteObject key=${key}`,
        'Could not delete the file from storage',
      );
    }
  }
}
