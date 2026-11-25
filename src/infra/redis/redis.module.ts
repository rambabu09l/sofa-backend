import { Global, Module } from '@nestjs/common';
import Redis from 'ioredis';
import { EnvService } from '../../config/env.service';
import { REDIS_CLIENT } from './redis.constants';
import { RedisService } from './redis.service';

@Global()
@Module({
  providers: [
    {
      provide: REDIS_CLIENT,
      inject: [EnvService],
      useFactory: (env: EnvService): Redis => {
        const password = env.get('REDIS_PASSWORD');

        return new Redis({
          host: env.get('REDIS_HOST'),
          port: env.get('REDIS_PORT'),
          password: password.length > 0 ? password : undefined,
          db: env.get('REDIS_DB'),
          keyPrefix: env.get('REDIS_KEY_PREFIX'),
          maxRetriesPerRequest: 3,
          enableReadyCheck: true,
          enableOfflineQueue: true,
          lazyConnect: true,
          tls: env.get('REDIS_TLS') ? {} : undefined,
          retryStrategy: (times) => Math.min(times * 200, 2000),
          reconnectOnError: (error) => {
            const message = error.message.toLowerCase();
            return (
              message.includes('readonly') ||
              message.includes('econnreset') ||
              message.includes('connection is closed') ||
              message.includes('econnrefused')
            );
          },
        });
      },
    },
    RedisService,
  ],
  exports: [REDIS_CLIENT, RedisService],
})
export class RedisModule {}
