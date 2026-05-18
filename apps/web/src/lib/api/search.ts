import { apiClient } from './client';
import type { SearchResponse } from '@/lib/types';

// ── Search by face image ──────────────────────────────────────────────────────
export async function searchByFace(
  file: File,
  topK = 10,
  onProgress?: (percent: number) => void,
): Promise<SearchResponse> {
  const form = new FormData();
  form.append('file', file);
  form.append('topK', String(topK));

  const { data } = await apiClient.post<SearchResponse>('/search', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress: (evt) => {
      if (evt.total && onProgress) {
        onProgress(Math.round((evt.loaded * 100) / evt.total));
      }
    },
  });
  return data;
}
