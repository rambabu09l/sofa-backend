import { Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';
import { ClamAvHealthIndicator } from './clamav.health';
import { HealthController } from './health.controller';
import { KafkaHealthIndicator } from './kafka.health';
import { RedisHealthIndicator } from './redis.health';
import { StorageHealthIndicator } from './storage.health';

@Module({
  imports: [TerminusModule],
  controllers: [HealthController],
  providers: [
    RedisHealthIndicator,
    ClamAvHealthIndicator,
    StorageHealthIndicator,
    KafkaHealthIndicator,
  ],
})
export class HealthModule {}
