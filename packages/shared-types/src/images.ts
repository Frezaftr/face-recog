// ── Image types ───────────────────────────────────────────────────────────────

export type ImageStatus = 'pending' | 'processing' | 'done' | 'failed';

export interface ImageRecord {
  id: string;
  userId: string;
  tenantId: string;
  filename: string;
  originalFilename: string;
  storageKey: string;
  mimeType: string;
  fileSize: number;
  status: ImageStatus;
  faceCount: number;
  errorMessage: string | null;
  createdAt: string;
  updatedAt: string;
  /** Signed URL — present when fetching single image */
  url?: string;
}

export interface UploadImageResponse {
  image: ImageRecord;
  uploadUrl?: string;
}

export interface PaginatedImages {
  data: ImageRecord[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
}
