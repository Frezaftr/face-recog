// ── Kafka event contracts ─────────────────────────────────────────────────────
// These types define the shape of messages flowing through Kafka topics.
// Both producers (API Gateway) and consumers (Worker) must use these types.

/** Topic: image.uploaded */
export interface ImageUploadedEvent {
  eventId: string;
  eventType: 'image.uploaded';
  version: 1;
  timestamp: string;
  payload: {
    imageId: string;
    storageKey: string;
    tenantId: string;
    userId: string;
    mimeType: string;
    fileSize: number;
  };
}

/** Topic: image.processed */
export interface ImageProcessedEvent {
  eventId: string;
  eventType: 'image.processed';
  version: 1;
  timestamp: string;
  payload: {
    imageId: string;
    tenantId: string;
    faceCount: number;
    status: 'done' | 'failed';
    errorMessage?: string;
    processingMs: number;
  };
}

export type FaceSearchEvent = ImageUploadedEvent | ImageProcessedEvent;

export type KafkaTopic = 'image.uploaded' | 'image.processed';
