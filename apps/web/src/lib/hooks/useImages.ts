'use client';

import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { toast } from 'sonner';
import * as imagesApi from '@/lib/api/images';
import { extractErrorMessage } from '@/lib/api/client';
import type { ImageRecord, PaginationParams } from '@/lib/types';

// ── List images ───────────────────────────────────────────────────────────────
export function useImages(params: PaginationParams = {}) {
  return useQuery(
    ['images', params],
    () => imagesApi.listImages(params),
    {
      keepPreviousData: true,
      staleTime: 30_000,
    },
  );
}

// ── Upload images ─────────────────────────────────────────────────────────────
export function useUploadImages() {
  const queryClient = useQueryClient();
  const [uploadProgress, setUploadProgress] = useState(0);

  const mutation = useMutation(
    (files: File[]) =>
      imagesApi.uploadImages(files, setUploadProgress),
    {
      onSuccess: (data: ImageRecord[]) => {
        queryClient.invalidateQueries('images');
        toast.success(`${data.length} image${data.length > 1 ? 's' : ''} uploaded successfully`);
        setUploadProgress(0);
      },
      onError: (error: unknown) => {
        toast.error(extractErrorMessage(error));
        setUploadProgress(0);
      },
    },
  );

  const upload = useCallback(
    (files: File[]) => mutation.mutateAsync(files),
    [mutation],
  );

  return {
    upload,
    uploadProgress,
    isUploading: mutation.isLoading,
    uploadedImages: mutation.data,
  };
}

// ── Delete image ──────────────────────────────────────────────────────────────
export function useDeleteImage() {
  const queryClient = useQueryClient();

  return useMutation(imagesApi.deleteImage, {
    onSuccess: () => {
      queryClient.invalidateQueries('images');
      toast.success('Image deleted');
    },
    onError: (error: unknown) => {
      toast.error(extractErrorMessage(error));
    },
  });
}
