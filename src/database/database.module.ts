import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EnvService } from '../config/env.service';
import { buildTypeOrmOptions } from './typeorm.options';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      inject: [EnvService],
      useFactory: (env: EnvService) => ({
        ...buildTypeOrmOptions({
          NODE_ENV: env.get('NODE_ENV'),
          MYSQL_HOST: env.get('MYSQL_HOST'),
          MYSQL_PORT: env.get('MYSQL_PORT'),
          MYSQL_USER: env.get('MYSQL_USER'),
          MYSQL_PASSWORD: env.get('MYSQL_PASSWORD'),
          MYSQL_DATABASE: env.get('MYSQL_DATABASE'),
          MYSQL_SYNC: env.get('MYSQL_SYNC'),
          MYSQL_LOGGING: env.get('MYSQL_LOGGING'),
          MYSQL_POOL_SIZE: env.get('MYSQL_POOL_SIZE'),
          MYSQL_CONNECT_TIMEOUT_MS: env.get('MYSQL_CONNECT_TIMEOUT_MS'),
          MYSQL_SSL: env.get('MYSQL_SSL'),
          MYSQL_SSL_REJECT_UNAUTHORIZED: env.get(
            'MYSQL_SSL_REJECT_UNAUTHORIZED',
          ),
        }),
        autoLoadEntities: true,
        retryAttempts: 10,
        retryDelay: 3000,
      }),
    }),
  ],
})
export class DatabaseModule {}
