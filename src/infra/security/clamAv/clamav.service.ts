import { Injectable, Logger } from '@nestjs/common';
import { rethrowServiceError } from '../../../common/http/service-error';
import { EnvService } from '../../../config/env.service';
import { clamavPing, clamavScanBuffer, clamavScanFile } from './clamav-client';
import type { ClamAvScanResult } from './types/clamav.types';

@Injectable()
export class ClamAvService {
  private readonly logger = new Logger(ClamAvService.name);

  constructor(private readonly env: EnvService) {}

  get enabled(): boolean {
    return this.env.get('CLAMAV_ENABLED');
  }

  private config() {
    return {
      host: this.env.get('CLAMAV_HOST'),
      port: this.env.get('CLAMAV_PORT'),
      timeoutMs: this.env.get('CLAMAV_TIMEOUT_MS'),
    };
  }

  async ping(): Promise<void> {
    try {
      if (!this.enabled) {
        return;
      }
      await clamavPing(this.config());
    } catch (error) {
      rethrowServiceError(
        error,
        this.logger,
        'ClamAvService.ping',
        'Could not reach the malware scanner',
      );
    }
  }

  async scanFile(filePath: string): Promise<ClamAvScanResult> {
    try {
      if (!this.enabled) {
        this.logger.warn('ClamAV disabled — skipping file scan');
        return { ok: true };
      }
      return await clamavScanFile(this.config(), filePath);
    } catch (error) {
      rethrowServiceError(
        error,
        this.logger,
        `ClamAvService.scanFile filePath=${filePath}`,
        'Could not scan the file for malware',
      );
    }
  }

  async scanBuffer(buffer: Buffer): Promise<ClamAvScanResult> {
    try {
      if (!this.enabled) {
        this.logger.warn('ClamAV disabled — skipping buffer scan');
        return { ok: true };
      }
      return await clamavScanBuffer(this.config(), buffer);
    } catch (error) {
      rethrowServiceError(
        error,
        this.logger,
        `ClamAvService.scanBuffer size=${buffer.length}`,
        'Could not scan the file for malware',
      );
    }
  }
}
