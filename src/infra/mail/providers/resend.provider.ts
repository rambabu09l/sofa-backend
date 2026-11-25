import { Injectable, Logger } from '@nestjs/common';
import { Resend } from 'resend';
import { EnvService } from '../../../config/env.service';
import { EmailProvider } from '../enum/email-provider.enums';
import type { MailProviderPort } from '../ports/mail-provider.port';
import type { MailMessage, MailSendResult } from '../types/mail-message';

@Injectable()
export class ResendProvider implements MailProviderPort {
  readonly name = EmailProvider.RESEND;
  private readonly logger = new Logger(ResendProvider.name);
  private client: Resend | null = null;

  constructor(private readonly env: EnvService) {}

  async verify(): Promise<void> {
    const apiKey = this.env.get('RESEND_API_KEY');
    if (!apiKey) {
      throw new Error('Resend is not configured (RESEND_API_KEY)');
    }

    const client = this.getClient(apiKey);
    const result = await client.domains.list();
    if (result.error) {
      throw new Error(result.error.message || 'Resend API key was rejected');
    }
    this.logger.log('Resend API verified');
  }

  async send(message: MailMessage): Promise<MailSendResult> {
    const apiKey = this.env.get('RESEND_API_KEY');
    if (!apiKey) {
      throw new Error('Resend is not configured (RESEND_API_KEY)');
    }

    const client = this.getClient(apiKey);
    const from = `${this.env.get('EMAIL_FROM_NAME')} <${this.env.get('EMAIL_FROM_ADDRESS')}>`;
    const result = await client.emails.send({
      from,
      to: message.to,
      subject: message.subject,
      text: message.text,
      html: message.html ?? message.text,
    });

    if (result.error) {
      throw new Error(result.error.message || 'Resend rejected the email');
    }

    this.logger.log(`Email sent via resend to=${message.to}`);
    return {
      provider: EmailProvider.RESEND,
      messageId: result.data?.id ?? null,
    };
  }

  private getClient(apiKey: string): Resend {
    if (this.client) {
      return this.client;
    }

    this.client = new Resend(apiKey);
    return this.client;
  }
}
