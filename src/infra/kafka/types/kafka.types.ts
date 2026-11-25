import { DOCUMENT_SCAN_MESSAGE_TYPE } from '../kafka.constants';

export type DocumentScanMessage = {
  type: typeof DOCUMENT_SCAN_MESSAGE_TYPE;
  documentId: string;
  publishedAt: string;
};

export type KafkaClientConfig = {
  clientId: string;
  brokers: string[];
  ssl: boolean;
};
