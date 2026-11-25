import type { MailMessage, MailSendResult } from '../types/mail-message';

export interface MailProviderPort {
  readonly name: string;
  send(message: MailMessage): Promise<MailSendResult>;
  /** Fail closed at Nest boot / readiness — proves credentials and reachability. */
  verify(): Promise<void>;
}
