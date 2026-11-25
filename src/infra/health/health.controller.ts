import { Controller, Get, VERSION_NEUTRAL } from '@nestjs/common';
import { ApiExcludeController } from '@nestjs/swagger';
import { SkipThrottle } from '@nestjs/throttler';
import {
  HealthCheck,
  HealthCheckService,
  MemoryHealthIndicator,
  TypeOrmHealthIndicator,
} from '@nestjs/terminus';
import { Public } from '../../common/decorators/public.decorator';
import { RawResponse } from '../../common/decorators/raw-response.decorator';
import { ClamAvHealthIndicator } from './clamav.health';
import { KafkaHealthIndicator } from './kafka.health';
import { RedisHealthIndicator } from './redis.health';
import { StorageHealthIndicator } from './storage.health';

@ApiExcludeController()
@SkipThrottle()
@RawResponse()
@Public()
@Controller({ path: 'health', version: VERSION_NEUTRAL })
export class HealthController {
  constructor(
    private readonly health: HealthCheckService,
    private readonly db: TypeOrmHealthIndicator,
    private readonly redis: RedisHealthIndicator,
    private readonly clamav: ClamAvHealthIndicator,
    private readonly storage: StorageHealthIndicator,
    private readonly kafka: KafkaHealthIndicator,
    private readonly memory: MemoryHealthIndicator,
  ) {}

  @Get('live')
  live() {
    return {
      status: 'ok',
      info: {
        process: { status: 'up' },
      },
    };
  }

  @Get('ready')
  @HealthCheck()
  ready() {
    return this.health.check([
      () => this.db.pingCheck('mysql'),
      () => this.redis.isHealthy('redis'),
      () => this.clamav.isHealthy('clamav'),
      () => this.storage.isHealthy('storage'),
      () => this.kafka.isHealthy('kafka'),
      () => this.memory.checkHeap('memory_heap', 512 * 1024 * 1024),
    ]);
  }
}
