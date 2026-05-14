import {
  Injectable,
  OnModuleInit,
  Logger,
  InternalServerErrorException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as Minio from 'minio';

@Injectable()
export class StorageService implements OnModuleInit {
  private readonly logger = new Logger(StorageService.name);
  private client: Minio.Client;
  private bucket: string;

  constructor(private readonly configService: ConfigService) {}

  async onModuleInit() {
    this.bucket = this.configService.get<string>('MINIO_BUCKET', 'images');

    this.client = new Minio.Client({
      endPoint:  this.configService.getOrThrow<string>('MINIO_ENDPOINT'),
      port:      parseInt(this.configService.get<string>('MINIO_PORT', '9000'), 10),
      useSSL:    this.configService.get('NODE_ENV') === 'production',
      accessKey: this.configService.getOrThrow<string>('MINIO_ACCESS_KEY'),
      secretKey: this.configService.getOrThrow<string>('MINIO_SECRET_KEY'),
    });

    const exists = await this.client.bucketExists(this.bucket);
    if (!exists) {
      await this.client.makeBucket(this.bucket, 'us-east-1');
      this.logger.log(`Created MinIO bucket: ${this.bucket}`);
    }
  }

  async putObject(
    key: string,
    data: Buffer,
    contentType: string,
  ): Promise<void> {
    try {
      await this.client.putObject(this.bucket, key, data, data.length, {
        'Content-Type': contentType,
      });
    } catch (err) {
      this.logger.error(`MinIO upload failed for key ${key}`, err);
      throw new InternalServerErrorException('Object storage upload failed');
    }
  }

  /** Signed URL — expires in 15 minutes by default */
  async presignedUrl(key: string, expirySeconds = 900): Promise<string> {
    return this.client.presignedGetObject(this.bucket, key, expirySeconds);
  }

  async removeObject(key: string): Promise<void> {
    await this.client.removeObject(this.bucket, key);
  }
}
