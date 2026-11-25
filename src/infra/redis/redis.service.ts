import { Inject, Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import Redis from 'ioredis';
import { REDIS_CLIENT } from './redis.constants';

@Injectable()
export class RedisService implements OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private shuttingDown = false;
  private reconnecting: Promise<void> | null = null;

  constructor(@Inject(REDIS_CLIENT) private readonly client: Redis) {}

  get raw(): Redis {
    return this.client;
  }

  async ping(): Promise<string> {
    await this.ensureConnected();
    return this.client.ping();
  }

  async get(key: string): Promise<string | null> {
    await this.ensureConnected();
    return this.client.get(key);
  }

  /** Atomically get-and-delete (Redis GETDEL). */
  async getdel(key: string): Promise<string | null> {
    await this.ensureConnected();
    return this.client.getdel(key);
  }

  async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
    await this.ensureConnected();
    if (ttlSeconds && ttlSeconds > 0) {
      await this.client.set(key, value, 'EX', ttlSeconds);
      return;
    }

    await this.client.set(key, value);
  }

  async del(key: string): Promise<number> {
    await this.ensureConnected();
    return this.client.del(key);
  }

  async onModuleDestroy(): Promise<void> {
    this.shuttingDown = true;
    if (this.client.status === 'end') {
      return;
    }

    try {
      await this.client.quit();
    } catch {
      this.client.disconnect();
    }
  }

  private async ensureConnected(): Promise<void> {
    if (this.shuttingDown) {
      return;
    }
    const status = this.client.status;
    if (status === 'ready' || status === 'connecting' || status === 'connect') {
      return;
    }
    if (this.reconnecting) {
      await this.reconnecting;
      return;
    }
    this.reconnecting = (async () => {
      this.logger.warn(
        `Redis status was "${status}" — reconnecting before command`,
      );
      try {
        await this.client.connect();
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        if (!/already\s+connecting|already\s+connected/i.test(message)) {
          throw error;
        }
      }
    })().finally(() => {
      this.reconnecting = null;
    });
    await this.reconnecting;
  }
}
