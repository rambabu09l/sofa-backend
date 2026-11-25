import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import type { Consumer, EachMessagePayload, Kafka, Producer } from 'kafkajs';
import { rethrowServiceError } from '../../common/http/service-error';
import { EnvService } from '../../config/env.service';
import {
  connectConsumer,
  connectProducer,
  createKafka,
  ensureTopic,
  kafkaPing,
} from './kafka-client';
import { DOCUMENT_SCAN_MESSAGE_TYPE } from './kafka.constants';
import type { DocumentScanMessage } from './types/kafka.types';

export type KafkaMessageHandler = (
  payload: EachMessagePayload,
) => Promise<void>;

@Injectable()
export class KafkaService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(KafkaService.name);
  private readonly kafka: Kafka;
  private producer: Producer | null = null;
  private readonly consumers: Consumer[] = [];
  private readonly documentScanTopic: string;
  private connectingProducer: Promise<Producer> | null = null;

  constructor(private readonly env: EnvService) {
    this.documentScanTopic = this.env.get('KAFKA_DOCUMENT_SCAN_TOPIC');
    this.kafka = createKafka({
      clientId: this.env.get('KAFKA_CLIENT_ID'),
      brokers: this.env
        .get('KAFKA_BROKERS')
        .split(',')
        .map((broker) => broker.trim())
        .filter((broker) => broker.length > 0),
      ssl: this.env.get('KAFKA_SSL'),
    });
  }

  async onModuleInit(): Promise<void> {
    await this.ensureProducer();
    this.logger.log(
      `Kafka producer connected topic=${this.documentScanTopic}`,
    );
  }

  async onModuleDestroy(): Promise<void> {
    for (const consumer of this.consumers) {
      await consumer.disconnect().catch(() => undefined);
    }
    if (this.producer) {
      await this.producer.disconnect().catch(() => undefined);
    }
  }

  async ping(): Promise<void> {
    try {
      await kafkaPing(this.kafka);
    } catch (error) {
      rethrowServiceError(
        error,
        this.logger,
        'KafkaService.ping',
        'Could not reach Kafka',
      );
    }
  }

  async publishDocumentScan(documentId: string): Promise<void> {
    try {
      const producer = await this.ensureProducer();
      const message: DocumentScanMessage = {
        type: DOCUMENT_SCAN_MESSAGE_TYPE,
        documentId,
        publishedAt: new Date().toISOString(),
      };
      await producer.send({
        topic: this.documentScanTopic,
        messages: [
          {
            key: documentId,
            value: JSON.stringify(message),
          },
        ],
      });
      this.logger.debug(
        `Published document scan message documentId=${documentId}`,
      );
    } catch (error) {
      rethrowServiceError(
        error,
        this.logger,
        `KafkaService.publishDocumentScan documentId=${documentId}`,
        'Could not queue the document malware scan',
      );
    }
  }

  async subscribeDocumentScan(
    groupId: string,
    handler: (message: DocumentScanMessage) => Promise<void>,
  ): Promise<void> {
    try {
      await ensureTopic(this.kafka, this.documentScanTopic);
      const consumer = await connectConsumer(this.kafka, groupId);
      this.consumers.push(consumer);
      await consumer.subscribe({
        topic: this.documentScanTopic,
        fromBeginning: false,
      });
      await consumer.run({
        eachMessage: async (payload) => {
          const raw = payload.message.value?.toString('utf8');
          if (!raw) {
            this.logger.warn('Ignoring empty document scan message');
            return;
          }
          let parsed: DocumentScanMessage;
          try {
            parsed = JSON.parse(raw) as DocumentScanMessage;
          } catch {
            this.logger.warn('Ignoring invalid document scan JSON');
            return;
          }
          if (
            parsed.type !== DOCUMENT_SCAN_MESSAGE_TYPE ||
            typeof parsed.documentId !== 'string' ||
            parsed.documentId.length === 0
          ) {
            this.logger.warn(
              'Ignoring document scan message with bad payload',
            );
            return;
          }
          await handler(parsed);
        },
      });
      this.logger.log(
        `Kafka document scan consumer started groupId=${groupId} topic=${this.documentScanTopic}`,
      );
    } catch (error) {
      const message =
        error instanceof Error ? error.message : String(error);
      this.logger.warn(
        `Kafka document scan consumer could not start (${message}). Retrying in 5s.`,
      );
      setTimeout(() => {
        void this.subscribeDocumentScan(groupId, handler);
      }, 5_000);
    }
  }

  private async ensureProducer(): Promise<Producer> {
    if (this.producer) {
      return this.producer;
    }
    if (!this.connectingProducer) {
      this.connectingProducer = (async () => {
        await ensureTopic(this.kafka, this.documentScanTopic);
        const producer = await connectProducer(this.kafka);
        this.producer = producer;
        return producer;
      })().finally(() => {
        this.connectingProducer = null;
      });
    }
    return this.connectingProducer;
  }
}
