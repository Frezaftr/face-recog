// ── Search types ──────────────────────────────────────────────────────────────

import type { BoundingBox } from './faces';

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

export interface SearchQueryParams {
  topK?: number;
}

export interface SearchLog {
  id: string;
  userId: string;
  tenantId: string;
  queryEmbeddingHash: string | null;
  resultsCount: number;
  latencyMs: number | null;
  topK: number;
  createdAt: string;
}
