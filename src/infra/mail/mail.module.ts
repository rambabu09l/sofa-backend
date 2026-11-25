import { Global, Module } from '@nestjs/common';
import { MailService } from './mail.service';
import { GmailSmtpProvider } from './providers/gmail-smtp.provider';
import { ResendProvider } from './providers/resend.provider';

@Global()
@Module({
  providers: [GmailSmtpProvider, ResendProvider, MailService],
  exports: [MailService],
})
export class MailModule {}
