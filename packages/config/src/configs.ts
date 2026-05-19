import { requireEnv, getEnv, getEnvInt, getEnvBool, getEnvList } from './env';

// ── API Gateway ───────────────────────────────────────────────────────────────

export interface ApiGatewayConfig {
  port: number;
  nodeEnv: string;
  jwtSecret: string;
  jwtExpiresIn: string;
  corsOrigin: string;
}

export function loadApiGatewayConfig(): ApiGatewayConfig {
  return {
    port: getEnvInt('PORT', 3000),
    nodeEnv: getEnv('NODE_ENV', 'development'),
    jwtSecret: requireEnv('JWT_SECRET'),
    jwtExpiresIn: getEnv('JWT_EXPIRES_IN', '7d'),
    corsOrigin: getEnv('CORS_ORIGIN', 'http://localhost:3001'),
  };
}

// ── Database ──────────────────────────────────────────────────────────────────

export interface DatabaseConfig {
  host: string;
  port: number;
  username: string;
  password: string;
  database: string;
  ssl: boolean;
}

export function loadDatabaseConfig(): DatabaseConfig {
  return {
    host: getEnv('DB_HOST', 'localhost'),
    port: getEnvInt('DB_PORT', 5432),
    username: requireEnv('DB_USER'),
    password: requireEnv('DB_PASSWORD'),
    database: requireEnv('DB_NAME'),
    ssl: getEnvBool('DB_SSL', false),
  };
}

// ── Kafka ─────────────────────────────────────────────────────────────────────

export interface KafkaConfig {
  brokers: string[];
  groupId: string;
  clientId: string;
  uploadTopic: string;
  processedTopic: string;
}

export function loadKafkaConfig(clientId: string): KafkaConfig {
  return {
    brokers: getEnvList('KAFKA_BROKERS', ['localhost:9092']),
    groupId: getEnv('KAFKA_GROUP_ID', 'facesearch-group'),
    clientId,
    uploadTopic: getEnv('KAFKA_UPLOAD_TOPIC', 'image.uploaded'),
    processedTopic: getEnv('KAFKA_PROCESSED_TOPIC', 'image.processed'),
  };
}

// ── MinIO / Object Storage ────────────────────────────────────────────────────

export interface StorageConfig {
  endpoint: string;
  port: number;
  useSSL: boolean;
  accessKey: string;
  secretKey: string;
  bucket: string;
  region: string;
  /** Pre-signed URL TTL in seconds */
  urlTtlSeconds: number;
}

export function loadStorageConfig(): StorageConfig {
  return {
    endpoint: getEnv('MINIO_ENDPOINT', 'localhost'),
    port: getEnvInt('MINIO_PORT', 9000),
    useSSL: getEnvBool('MINIO_USE_SSL', false),
    accessKey: requireEnv('MINIO_ACCESS_KEY'),
    secretKey: requireEnv('MINIO_SECRET_KEY'),
    bucket: getEnv('MINIO_BUCKET', 'facesearch'),
    region: getEnv('MINIO_REGION', 'us-east-1'),
    urlTtlSeconds: getEnvInt('MINIO_URL_TTL_SECONDS', 3600),
  };
}

// ── Face Service ──────────────────────────────────────────────────────────────

export interface FaceServiceConfig {
  url: string;
  timeoutMs: number;
  maxRetries: number;
}

export function loadFaceServiceConfig(): FaceServiceConfig {
  return {
    url: getEnv('FACE_SERVICE_URL', 'http://localhost:8000'),
    timeoutMs: getEnvInt('FACE_SERVICE_TIMEOUT_MS', 30000),
    maxRetries: getEnvInt('FACE_SERVICE_MAX_RETRIES', 3),
  };
}

// ── Worker ────────────────────────────────────────────────────────────────────

export interface WorkerConfig {
  concurrency: number;
  kafka: KafkaConfig;
  faceService: FaceServiceConfig;
  storage: StorageConfig;
  databaseUrl: string;
}

export function loadWorkerConfig(): WorkerConfig {
  return {
    concurrency: getEnvInt('WORKER_CONCURRENCY', 4),
    kafka: loadKafkaConfig('facesearch-worker'),
    faceService: loadFaceServiceConfig(),
    storage: loadStorageConfig(),
    databaseUrl: requireEnv('DATABASE_URL'),
  };
}

export { requireEnv, getEnv, getEnvInt, getEnvBool, getEnvList };
