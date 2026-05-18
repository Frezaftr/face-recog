// ─────────────────────────────────────────────────────────────────────────────
// Shared TypeScript types — mirrors API Gateway response shapes
// ─────────────────────────────────────────────────────────────────────────────

// ── Auth ─────────────────────────────────────────────────────────────────────

export interface User {
  id: string;
  email: string;
  createdAt: string;
}

export interface AuthResponse {
  accessToken: string;
  user: User;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  email: string;
  password: string;
}

// ── Images ───────────────────────────────────────────────────────────────────

export type ImageStatus = 'pending' | 'processing' | 'done' | 'failed';

export interface ImageRecord {
  id: string;
  filename: string;
  storageKey: string;
  mimeType: string;
  sizeBytes: number;
  status: ImageStatus;
  faceCount: number | null;
  errorMessage: string | null;
  uploadedAt: string;
  processedAt: string | null;
  url?: string; // signed URL — returned on /images/:id
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

// ── Search ───────────────────────────────────────────────────────────────────

export interface BoundingBox {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

export interface SearchResultItem {
  imageId: string;
  filename: string;
  url: string;
  similarity: number;
  faceId: string;
  bbox: BoundingBox;
}

export interface SearchResponse {
  results: SearchResultItem[];
  queryFaceCount: number;
  topK: number;
  latencyMs: number;
}

// ── API errors ───────────────────────────────────────────────────────────────

export interface ApiError {
  statusCode: number;
  message: string | string[];
  error?: string;
  timestamp: string;
}
