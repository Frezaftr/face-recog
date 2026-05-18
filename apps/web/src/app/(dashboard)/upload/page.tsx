'use client';

import type { Metadata } from 'next';
import { CheckCircle } from 'lucide-react';
import { ImageUploader } from '@/components/ImageUploader';
import { ImageCard } from '@/components/ImageCard';
import { Spinner } from '@/components/ui/Spinner';
import { useUploadImages, useImages, useDeleteImage } from '@/lib/hooks/useImages';

export default function UploadPage() {
  const { upload, isUploading, uploadProgress } = useUploadImages();
  const { data: paginated, isLoading: loadingImages } = useImages({ limit: 24 });
  const { mutate: deleteImage, isLoading: isDeleting, variables: deletingId } =
    useDeleteImage();

  return (
    <div className="space-y-10">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-zinc-100">Upload Images</h1>
        <p className="mt-1 text-sm text-zinc-400">
          Drop images here. Faces are automatically detected and indexed in the background.
        </p>
      </div>

      {/* Uploader */}
      <ImageUploader
        onUpload={upload}
        isUploading={isUploading}
        uploadProgress={uploadProgress}
      />

      {/* Recent uploads */}
      <div className="space-y-4">
        <h2 className="text-base font-semibold text-zinc-300">Recent uploads</h2>

        {loadingImages ? (
          <div className="flex justify-center py-12">
            <Spinner />
          </div>
        ) : paginated?.data.length === 0 ? (
          <p className="py-12 text-center text-sm text-zinc-500">
            No images yet — upload some above!
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
            {paginated?.data.map((img) => (
              <ImageCard
                key={img.id}
                image={img}
                onDelete={(id) => deleteImage(id)}
                isDeleting={isDeleting && deletingId === img.id}
              />
            ))}
          </div>
        )}

        {/* Pagination hint */}
        {paginated && paginated.total > paginated.limit && (
          <p className="text-center text-xs text-zinc-500">
            Showing {paginated.data.length} of {paginated.total} images. Visit{' '}
            <a href="/images" className="text-indigo-400 hover:underline">
              My Images
            </a>{' '}
            for full gallery.
          </p>
        )}
      </div>
    </div>
  );
}
