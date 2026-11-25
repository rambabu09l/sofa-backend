import { EmailProvider } from '../enum/email-provider.enums';

export type MailMessage = {
  to: string;
  subject: string;
  text: string;
  html?: string;
};

export type MailSendResult = {
  provider: EmailProvider;
  messageId: string | null;
};
