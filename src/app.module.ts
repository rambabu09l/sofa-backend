import { Module } from '@nestjs/common';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { LoggerModule } from 'nestjs-pino';
import { SuperTokensModule } from 'supertokens-nestjs';
import { SofaSuperTokensAuthGuard } from './modules/auth/guards/sofa-supertokens-auth.guard';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { ResponseInterceptor } from './common/interceptors/response.interceptor';
import { buildLoggerParams } from './common/logger/logger.config';
import { AppConfigModule } from './config/config.module';
import { EnvService } from './config/env.service';
import { createSuperTokensModuleOptions } from './config/supertokens.config';
import { DatabaseModule } from './database/database.module';
import { DependencyBootstrapService } from './infra/bootstrap/dependency-bootstrap.service';
import { HealthModule } from './infra/health/health.module';
import { KafkaModule } from './infra/kafka/kafka.module';
import { MailModule } from './infra/mail/mail.module';
import { QueueModule } from './infra/queue/queue.module';
import { RedisModule } from './infra/redis/redis.module';
import { SecurityModule } from './infra/security/security.module';
import { StorageModule } from './infra/storage/storage.module';
import { AuthModule } from './modules/auth/auth.module';
import { SofaSessionUserGuard } from './modules/auth/guards/sofa-session-user.guard';
import { MastersModule } from './modules/masters/masters.module';
import { PermissionsGuard } from './modules/permissions/guards/permissions.guard';
import { PermissionsModule } from './modules/permissions/permissions.module';
import { UsersModule } from './modules/users/users.module';

@Module({
  imports: [
    AppConfigModule,
    SuperTokensModule.forRootAsync({
      inject: [EnvService],
      useFactory: (env: EnvService) => createSuperTokensModuleOptions(env),
    }),
    LoggerModule.forRootAsync({
      inject: [EnvService],
      useFactory: (env: EnvService) => buildLoggerParams(env),
    }),
    ThrottlerModule.forRootAsync({
      inject: [EnvService],
      useFactory: (env: EnvService) => ({
        throttlers: [
          {
            ttl: env.get('THROTTLE_TTL_MS'),
            limit: env.get('THROTTLE_LIMIT'),
          },
        ],
      }),
    }),
    DatabaseModule,
    RedisModule,
    MailModule,
    QueueModule,
    SecurityModule,
    StorageModule,
    KafkaModule,
    AuthModule,
    UsersModule,
    PermissionsModule,
    MastersModule,
    HealthModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    DependencyBootstrapService,
    {
      provide: APP_FILTER,
      useClass: AllExceptionsFilter,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: ResponseInterceptor,
    },
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    {
      provide: APP_GUARD,
      useClass: SofaSuperTokensAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: SofaSessionUserGuard,
    },
    {
      // Fine-grained Sofa permissions (MySQL). Coarse ST roles use `@VerifySession({ roles })`.
      provide: APP_GUARD,
      useClass: PermissionsGuard,
    },
  ],
})
export class AppModule {}
