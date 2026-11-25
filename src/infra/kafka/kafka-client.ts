import { Kafka, logLevel, type Consumer, type Producer } from 'kafkajs';
import type { KafkaClientConfig } from './types/kafka.types';

export function createKafka(config: KafkaClientConfig): Kafka {
  return new Kafka({
    clientId: config.clientId,
    brokers: config.brokers,
    ssl: config.ssl || undefined,
    logLevel: logLevel.ERROR,
  });
}

export async function kafkaPing(kafka: Kafka): Promise<void> {
  const admin = kafka.admin();
  try {
    await admin.connect();
    await admin.describeCluster();
  } finally {
    await admin.disconnect().catch(() => undefined);
  }
}

export async function ensureTopic(
  kafka: Kafka,
  topic: string,
  numPartitions = 1,
): Promise<void> {
  const admin = kafka.admin();
  try {
    await admin.connect();
    const existing = await admin.listTopics();
    if (existing.includes(topic)) {
      return;
    }
    await admin.createTopics({
      topics: [{ topic, numPartitions, replicationFactor: 1 }],
      waitForLeaders: true,
    });
  } finally {
    await admin.disconnect().catch(() => undefined);
  }
}

export async function connectProducer(kafka: Kafka): Promise<Producer> {
  const producer = kafka.producer();
  await producer.connect();
  return producer;
}

export async function connectConsumer(
  kafka: Kafka,
  groupId: string,
): Promise<Consumer> {
  const consumer = kafka.consumer({ groupId });
  await consumer.connect();
  return consumer;
}
