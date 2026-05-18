import { apiClient } from './client';
import type { ImageRecord, PaginatedImages, PaginationParams } from '@/lib/types';

// ── Upload one or many images ─────────────────────────────────────────────────
export async function uploadImages(
  files: File[],
  onProgress?: (percent: number) => void,
): Promise<ImageRecord[]> {
  const form = new FormData();
  files.forEach((file) => form.append('files', file));

  const { data } = await apiClient.post<ImageRecord[]>('/images/upload', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress: (evt) => {
      if (evt.total && onProgress) {
        onProgress(Math.round((evt.loaded * 100) / evt.total));
      }
    },
  });
  return data;
}

// ── List images (paginated) ───────────────────────────────────────────────────
export async function listImages(params: PaginationParams = {}): Promise<PaginatedImages> {
  const { data } = await apiClient.get<PaginatedImages>('/images', { params });
  return data;
}

// ── Get single image (includes signed URL) ────────────────────────────────────
export async function getImage(id: string): Promise<ImageRecord> {
  const { data } = await apiClient.get<ImageRecord>(`/images/${id}`);
  return data;
}

// ── Delete image ──────────────────────────────────────────────────────────────
export async function deleteImage(id: string): Promise<void> {
  await apiClient.delete(`/images/${id}`);
}
