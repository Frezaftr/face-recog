'use client';

import { useState } from 'react';
import { ImageCard } from '@/components/ImageCard';
import { Spinner } from '@/components/ui/Spinner';
import { Button } from '@/components/ui/Button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useImages, useDeleteImage } from '@/lib/hooks/useImages';

const PAGE_SIZE = 24;

export default function ImagesPage() {
  const [page, setPage] = useState(1);
  const { data, isLoading } = useImages({ page, limit: PAGE_SIZE });
  const { mutate: deleteImage, isLoading: isDeleting, variables: deletingId } =
    useDeleteImage();

  const totalPages = data?.totalPages ?? 1;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-100">My Images</h1>
          {data && (
            <p className="mt-0.5 text-sm text-zinc-400">
              {data.total} image{data.total !== 1 ? 's' : ''} total
            </p>
          )}
        </div>
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="flex justify-center py-20">
          <Spinner size="lg" />
        </div>
      ) : data?.data.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-zinc-700 py-20 text-zinc-500">
          <svg className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <p className="text-sm">No images yet. Go to Upload to add some!</p>
          <Button size="sm" variant="outline" onClick={() => (window.location.href = '/upload')}>
            Upload images
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
          {data?.data.map((img) => (
            <ImageCard
              key={img.id}
              image={img}
              onDelete={(id) => deleteImage(id)}
              isDeleting={isDeleting && deletingId === img.id}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1 || isLoading}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm text-zinc-400">
            Page <span className="font-semibold text-zinc-200">{page}</span> of {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages || isLoading}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
