import { BullModule } from '@nestjs/bullmq';
import { Global, Module } from '@nestjs/common';
import { EnvService } from '../../config/env.service';
import { NOTIFICATION_EMAIL_QUEUE } from './queue.constants';

@Global()
@Module({
  imports: [
    BullModule.forRootAsync({
      inject: [EnvService],
      useFactory: (env: EnvService) => {
        const password = env.get('REDIS_PASSWORD');
        return {
          connection: {
            host: env.get('REDIS_HOST'),
            port: env.get('REDIS_PORT'),
            password: password.length > 0 ? password : undefined,
            db: env.get('REDIS_DB'),
            tls: env.get('REDIS_TLS') ? {} : undefined,
          },
          prefix: `${env.get('REDIS_KEY_PREFIX')}bull`,
        };
      },
    }),
    BullModule.registerQueue({
      name: NOTIFICATION_EMAIL_QUEUE,
    }),
  ],
  exports: [BullModule],
})
export class QueueModule {}
