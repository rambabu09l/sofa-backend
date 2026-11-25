import { Injectable } from '@nestjs/common';
import {
  HealthIndicatorResult,
  HealthIndicatorService,
} from '@nestjs/terminus';
import { ClamAvService } from '../security/clamAv/clamav.service';

@Injectable()
export class ClamAvHealthIndicator {
  constructor(
    private readonly healthIndicatorService: HealthIndicatorService,
    private readonly clamav: ClamAvService,
  ) {}

  async isHealthy(key: string): Promise<HealthIndicatorResult> {
    const indicator = this.healthIndicatorService.check(key);

    if (!this.clamav.enabled) {
      return indicator.up({ disabled: true });
    }

    try {
      await this.clamav.ping();
      return indicator.up();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'ClamAV ping failed';
      return indicator.down({ message });
    }
  }
}
