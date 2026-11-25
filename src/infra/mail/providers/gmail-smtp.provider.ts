import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';
import { EnvService } from '../../../config/env.service';
import { EmailProvider } from '../enum/email-provider.enums';
import type { MailProviderPort } from '../ports/mail-provider.port';
import type { MailMessage, MailSendResult } from '../types/mail-message';

@Injectable()
export class GmailSmtpProvider implements MailProviderPort {
  readonly name = EmailProvider.GMAIL;
  private readonly logger = new Logger(GmailSmtpProvider.name);
  private transporter: Transporter | null = null;

  constructor(private readonly env: EnvService) {}

  async verify(): Promise<void> {
    const username = this.env.get('SMTP_USERNAME');
    const password = this.resolvePassword();
    if (!username || !password) {
      throw new Error(
        'SMTP is not configured (set SMTP_USERNAME and SMTP_PASSWORD or SMTP_APP_PASSWORD)',
      );
    }

    const transporter = this.getTransporter(username, password);
    await transporter.verify();
    this.logger.log(
      `SMTP verified host=${this.env.get('SMTP_HOST')} port=${this.env.get('SMTP_PORT')}`,
    );
  }

  async send(message: MailMessage): Promise<MailSendResult> {
    const username = this.env.get('SMTP_USERNAME');
    const password = this.resolvePassword();
    if (!username || !password) {
      throw new Error(
        'SMTP is not configured (set SMTP_USERNAME and SMTP_PASSWORD or SMTP_APP_PASSWORD)',
      );
    }

    const transporter = this.getTransporter(username, password);
    const info = await transporter.sendMail({
      from: this.formatFrom(),
      to: message.to,
      subject: message.subject,
      text: message.text,
      html: message.html,
    });

    this.logger.log(`Email sent via smtp to=${message.to}`);
    return {
      provider: EmailProvider.GMAIL,
      messageId: typeof info.messageId === 'string' ? info.messageId : null,
    };
  }

  private resolvePassword(): string {
    const password = this.env.get('SMTP_PASSWORD');
    if (password.length > 0) {
      return password;
    }
    return this.env.get('SMTP_APP_PASSWORD');
  }

  private getTransporter(username: string, password: string): Transporter {
    if (this.transporter) {
      return this.transporter;
    }

    this.transporter = nodemailer.createTransport({
      host: this.env.get('SMTP_HOST'),
      port: this.env.get('SMTP_PORT'),
      secure: this.env.get('SMTP_SECURE'),
      auth: {
        user: username,
        pass: password,
      },
    });

    return this.transporter;
  }

  private formatFrom(): string {
    const name = this.env.get('EMAIL_FROM_NAME');
    const address = this.env.get('EMAIL_FROM_ADDRESS');
    return `${name} <${address}>`;
  }
}
