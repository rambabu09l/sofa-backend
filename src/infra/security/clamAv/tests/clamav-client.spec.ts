import { EventEmitter } from 'node:events';
import { Readable } from 'node:stream';
import { clamavScanStream, type ClamAvClientConfig } from '../clamav-client';

jest.mock('node:net', () => {
  const actual = jest.requireActual<typeof import('node:net')>('node:net');
  return {
    ...actual,
    createConnection: jest.fn(),
  };
});

import { createConnection } from 'node:net';

const mockedCreateConnection = createConnection as jest.MockedFunction<
  typeof createConnection
>;

function mockSocket(response: string) {
  const socket = new EventEmitter() as EventEmitter & {
    write: jest.Mock;
    setTimeout: jest.Mock;
    destroy: jest.Mock;
  };
  socket.setTimeout = jest.fn();
  socket.destroy = jest.fn();
  socket.write = jest.fn((chunk: Buffer) => {
    // 4-byte zero length terminator ends the INSTREAM transfer.
    if (
      Buffer.isBuffer(chunk) &&
      chunk.length === 4 &&
      chunk.readUInt32BE(0) === 0
    ) {
      queueMicrotask(() => {
        socket.emit('data', Buffer.from(response));
        socket.emit('end');
      });
    }
    return true;
  });
  mockedCreateConnection.mockImplementation((_opts, cb) => {
    queueMicrotask(() => cb?.());
    return socket as unknown as ReturnType<typeof createConnection>;
  });
  return socket;
}

describe('clamavScanStream', () => {
  const config: ClamAvClientConfig = {
    host: '127.0.0.1',
    port: 3310,
    timeoutMs: 5_000,
  };

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('returns ok for clean stream', async () => {
    mockSocket('stream: OK');
    await expect(
      clamavScanStream(config, Readable.from([Buffer.from('clean')])),
    ).resolves.toEqual({ ok: true });
  });

  it('returns infected when FOUND', async () => {
    mockSocket('stream: Eicar-Signature FOUND');
    await expect(
      clamavScanStream(config, Readable.from([Buffer.from('eicar')])),
    ).resolves.toEqual({
      ok: false,
      infected: true,
      signature: 'Eicar-Signature',
    });
  });

  it('returns error when socket fails', async () => {
    const socket = new EventEmitter() as EventEmitter & {
      write: jest.Mock;
      setTimeout: jest.Mock;
      destroy: jest.Mock;
    };
    socket.write = jest.fn();
    socket.setTimeout = jest.fn();
    socket.destroy = jest.fn();
    mockedCreateConnection.mockImplementation((_opts, cb) => {
      queueMicrotask(() => {
        cb?.();
        socket.emit('error', new Error('ECONNREFUSED'));
      });
      return socket as unknown as ReturnType<typeof createConnection>;
    });
    await expect(
      clamavScanStream(config, Readable.from([Buffer.from('x')])),
    ).resolves.toEqual({
      ok: false,
      infected: false,
      error: 'ECONNREFUSED',
    });
  });
});
