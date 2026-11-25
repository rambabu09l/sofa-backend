import { createConnection } from 'node:net';
import { createReadStream } from 'node:fs';
import { Readable } from 'node:stream';
import type {
  ClamAvClientConfig,
  ClamAvScanResult,
} from './types/clamav.types';

export type {
  ClamAvClientConfig,
  ClamAvScanResult,
} from './types/clamav.types';

/**
 * Minimal clamd INSTREAM client (no extra dependency).
 * Protocol: zINSTREAM\0 + length-prefixed chunks + 0-length terminator.
 */
export async function clamavPing(config: ClamAvClientConfig): Promise<void> {
  const response = await sendCommand(config, Buffer.from('zPING\0'));
  if (!response.includes('PONG')) {
    throw new Error(`ClamAV ping failed: ${response || 'empty response'}`);
  }
}

export async function clamavScanBuffer(
  config: ClamAvClientConfig,
  buffer: Buffer,
): Promise<ClamAvScanResult> {
  return clamavScanStream(config, Readable.from(buffer));
}

export async function clamavScanFile(
  config: ClamAvClientConfig,
  filePath: string,
): Promise<ClamAvScanResult> {
  return clamavScanStream(config, createReadStream(filePath));
}

export async function clamavScanStream(
  config: ClamAvClientConfig,
  stream: Readable,
): Promise<ClamAvScanResult> {
  try {
    const response = await new Promise<string>((resolve, reject) => {
      const socket = createConnection(
        { host: config.host, port: config.port },
        () => {
          socket.write(Buffer.from('zINSTREAM\0'));
        },
      );
      socket.setTimeout(config.timeoutMs);
      const chunks: Buffer[] = [];

      socket.on('data', (chunk: Buffer) => {
        chunks.push(chunk);
      });
      socket.on('error', (error) => reject(error));
      socket.on('timeout', () => {
        socket.destroy();
        reject(new Error('ClamAV scan timed out'));
      });
      socket.on('end', () => {
        resolve(Buffer.concat(chunks).toString('utf8').trim());
      });

      stream.on('error', (error) => {
        socket.destroy();
        reject(error);
      });
      stream.on('data', (chunk: Buffer | string) => {
        const buf = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
        const header = Buffer.alloc(4);
        header.writeUInt32BE(buf.length, 0);
        socket.write(header);
        socket.write(buf);
      });
      stream.on('end', () => {
        const end = Buffer.alloc(4);
        end.writeUInt32BE(0, 0);
        socket.write(end);
      });
    });

    if (response.includes('OK') && !response.includes('FOUND')) {
      return { ok: true };
    }
    const found = response.match(/:\s*(.+)\s+FOUND/i);
    const signature = found?.[1]?.trim();
    if (signature) {
      return { ok: false, infected: true, signature };
    }
    return {
      ok: false,
      infected: false,
      error: response || 'Unknown ClamAV response',
    };
  } catch (error) {
    return {
      ok: false,
      infected: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

function sendCommand(
  config: ClamAvClientConfig,
  command: Buffer,
): Promise<string> {
  return new Promise((resolve, reject) => {
    const socket = createConnection(
      { host: config.host, port: config.port },
      () => {
        socket.write(command);
      },
    );
    socket.setTimeout(config.timeoutMs);
    const chunks: Buffer[] = [];
    socket.on('data', (chunk: Buffer) => chunks.push(chunk));
    socket.on('error', reject);
    socket.on('timeout', () => {
      socket.destroy();
      reject(new Error('ClamAV command timed out'));
    });
    socket.on('end', () =>
      resolve(Buffer.concat(chunks).toString('utf8').trim()),
    );
  });
}
