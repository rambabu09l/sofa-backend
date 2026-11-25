import { Logger } from '@nestjs/common';
import { ClamAvService } from '../clamav.service';
import * as clamavClient from '../clamav-client';
import type { EnvService } from '../../../../config/env.service';

jest.mock('../clamav-client', () => ({
  clamavPing: jest.fn(),
  clamavScanFile: jest.fn(),
  clamavScanBuffer: jest.fn(),
}));

describe('ClamAvService', () => {
  const env = {
    get: jest.fn(),
  } as unknown as EnvService;

  let service: ClamAvService;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(Logger.prototype, 'warn').mockImplementation(() => undefined);
    jest.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined);
    service = new ClamAvService(env);
  });

  function mockEnv(enabled: boolean) {
    (env.get as jest.Mock).mockImplementation((key: string) => {
      switch (key) {
        case 'CLAMAV_ENABLED':
          return enabled;
        case 'CLAMAV_HOST':
          return '127.0.0.1';
        case 'CLAMAV_PORT':
          return 3310;
        case 'CLAMAV_TIMEOUT_MS':
          return 5_000;
        default:
          return undefined;
      }
    });
  }

  it('skips scanFile when disabled', async () => {
    mockEnv(false);
    await expect(service.scanFile('/tmp/a')).resolves.toEqual({ ok: true });
    expect(clamavClient.clamavScanFile).not.toHaveBeenCalled();
  });

  it('scans file when enabled', async () => {
    mockEnv(true);
    (clamavClient.clamavScanFile as jest.Mock).mockResolvedValue({ ok: true });
    await expect(service.scanFile('/tmp/a')).resolves.toEqual({ ok: true });
    expect(clamavClient.clamavScanFile).toHaveBeenCalledWith(
      { host: '127.0.0.1', port: 3310, timeoutMs: 5_000 },
      '/tmp/a',
    );
  });

  it('skips ping when disabled', async () => {
    mockEnv(false);
    await expect(service.ping()).resolves.toBeUndefined();
    expect(clamavClient.clamavPing).not.toHaveBeenCalled();
  });
});
