import { Injectable, Logger } from '@nestjs/common';
import { EnvService } from '../../config/env.service';
import { EmailProvider } from './enum/email-provider.enums';
import type { MailProviderPort } from './ports/mail-provider.port';
import { GmailSmtpProvider } from './providers/gmail-smtp.provider';
import { ResendProvider } from './providers/resend.provider';
import type { MailMessage, MailSendResult } from './types/mail-message';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);

  constructor(
    private readonly env: EnvService,
    private readonly gmail: GmailSmtpProvider,
    private readonly resend: ResendProvider,
  ) {}

  /**
   * Reachability check for the primary mail provider (SMTP verify or Resend API).
   * Used at Nest boot so a bad primary config fails startup.
   * Fallback is still used at send time; it is not required at boot.
   */
  async verify(): Promise<void> {
    const primary = this.resolveProvider(
      this.env.get('EMAIL_PRIMARY_PROVIDER'),
    );
    await primary.verify();
    this.logger.log(`Mail primary provider verified provider=${primary.name}`);
  }

  async send(message: MailMessage): Promise<MailSendResult> {
    try {
      if (!message.to?.trim()) {
        throw new Error('Email recipient address is required');
      }
      if (!message.subject?.trim()) {
        throw new Error('Email subject is required');
      }
      if (!message.text?.trim() && !message.html?.trim()) {
        throw new Error('Email body is required');
      }

      const primary = this.resolveProvider(
        this.env.get('EMAIL_PRIMARY_PROVIDER'),
      );
      const fallback = this.resolveProvider(
        this.env.get('EMAIL_FALLBACK_PROVIDER'),
      );

      try {
        const result = await primary.send(message);
        this.logger.log(
          `Mail delivered via primary provider=${result.provider} to=${message.to}`,
        );
        return result;
      } catch (primaryError) {
        const primaryMessage =
          primaryError instanceof Error
            ? primaryError.message
            : String(primaryError);
        this.logger.warn(
          `Primary mail provider=${primary.name} failed: ${primaryMessage}`,
        );

        if (fallback.name === primary.name) {
          throw new Error(
            'Could not send the email because the primary provider failed and no fallback provider is configured',
          );
        }

        try {
          const result = await fallback.send(message);
          this.logger.log(
            `Mail delivered via fallback provider=${result.provider} to=${message.to}`,
          );
          return result;
        } catch (fallbackError) {
          const fallbackMessage =
            fallbackError instanceof Error
              ? fallbackError.message
              : String(fallbackError);
          this.logger.error(
            `Both mail providers failed primary=${primary.name} fallback=${fallback.name}`,
          );
          throw new Error(
            `Could not send the email. Primary provider failed (${primaryMessage}) and fallback provider failed (${fallbackMessage})`,
          );
        }
      }
    } catch (error) {
      const messageText =
        error instanceof Error ? error.message : String(error);
      this.logger.error(`MailService.send failed to=${message.to}`, messageText);
      throw error instanceof Error
        ? error
        : new Error('Could not send the email');
    }
  }

  private resolveProvider(name: string): MailProviderPort {
    if (name === EmailProvider.GMAIL) {
      return this.gmail;
    }
    if (name === EmailProvider.RESEND) {
      return this.resend;
    }
    throw new Error(
      `Could not send the email because the provider "${name}" is not supported`,
    );
  }
}
