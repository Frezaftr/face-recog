import {
  Injectable,
  OnModuleInit,
  OnModuleDestroy,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Kafka, Producer, CompressionTypes, logLevel } from 'kafkajs';

@Injectable()
export class KafkaService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(KafkaService.name);
  private producer: Producer;

  constructor(private readonly configService: ConfigService) {}

  async onModuleInit() {
    const brokers = this.configService
      .getOrThrow<string>('KAFKA_BROKERS')
      .split(',');

    const kafka = new Kafka({
      clientId: 'api-gateway',
      brokers,
      logLevel: logLevel.WARN,
      retry: { retries: 5, initialRetryTime: 300 },
    });

    this.producer = kafka.producer({
      allowAutoTopicCreation: true,
      idempotent: true, // exactly-once semantics
    });

    await this.producer.connect();
    this.logger.log('Kafka producer connected');
  }

  async publish(topic: string, message: Record<string, unknown>): Promise<void> {
    await this.producer.send({
      topic,
      compression: CompressionTypes.GZIP,
      messages: [{ value: JSON.stringify(message) }],
    });
  }

  async onModuleDestroy() {
    await this.producer?.disconnect();
  }
}
