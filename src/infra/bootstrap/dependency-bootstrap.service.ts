import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { KafkaService } from '../kafka/kafka.service';
import { MailService } from '../mail/mail.service';
import { ClamAvService } from '../security/clamAv/clamav.service';

/**
 * Fail closed at Nest boot when ClamAV (if enabled), mail, or Kafka is unreachable.
 * Readiness (`/health/ready`) still re-checks these after the process is up.
 */
@Injectable()
export class DependencyBootstrapService implements OnApplicationBootstrap {
  private readonly logger = new Logger(DependencyBootstrapService.name);

  constructor(
    private readonly clamav: ClamAvService,
    private readonly mail: MailService,
    private readonly kafka: KafkaService,
  ) {}

  async onApplicationBootstrap(): Promise<void> {
    this.logger.log('Verifying infrastructure dependencies at boot…');
    await this.require('ClamAV', async () => {
      if (!this.clamav.enabled) {
        this.logger.warn('ClamAV disabled — skipping boot ping');
        return;
      }
      await this.clamav.ping();
    });
    await this.require('Mail', () => this.mail.verify());
    await this.require('Kafka', () => this.kafka.ping());
    this.logger.log('Infrastructure dependencies OK (ClamAV, Mail, Kafka)');
  }

  private async require(
    name: string,
    check: () => Promise<void>,
  ): Promise<void> {
    try {
      await check();
      this.logger.log(`${name} OK`);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(`${name} failed at boot: ${message}`);
      throw new Error(
        `${name} is required at startup but is unavailable: ${message}`,
      );
    }
  }
}
