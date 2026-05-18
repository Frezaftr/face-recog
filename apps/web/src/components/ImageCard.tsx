'use client';

import { useState } from 'react';
import { Trash2, Eye } from 'lucide-react';
import { cn, formatBytes, timeAgo } from '@/lib/utils';
import { StatusBadge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import type { ImageRecord } from '@/lib/types';

interface ImageCardProps {
  image: ImageRecord;
  onDelete?: (id: string) => void;
  isDeleting?: boolean;
}

export function ImageCard({ image, onDelete, isDeleting }: ImageCardProps) {
  const [imgError, setImgError] = useState(false);

  return (
    <div
      className={cn(
        'group relative flex flex-col overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900 transition-all hover:-translate-y-0.5 hover:shadow-md hover:shadow-zinc-950/60',
        isDeleting && 'pointer-events-none opacity-40',
      )}
    >
      {/* Thumbnail */}
      <div className="relative aspect-square overflow-hidden bg-zinc-800">
        {!imgError && image.url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={image.url}
            alt={image.filename}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="flex h-full items-center justify-center text-zinc-600">
            <svg className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
          </div>
        )}

        {/* Status badge */}
        <div className="absolute left-2 top-2">
          <StatusBadge status={image.status} />
        </div>

        {/* Action overlay */}
        <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
          {onDelete && (
            <Button
              variant="destructive"
              size="sm"
              onClick={() => onDelete(image.id)}
              aria-label="Delete image"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="flex flex-col gap-0.5 p-2.5">
        <p className="truncate text-xs font-medium text-zinc-300">{image.filename}</p>
        <div className="flex items-center justify-between text-xs text-zinc-500">
          <span>{formatBytes(image.sizeBytes)}</span>
          {image.faceCount !== null && (
            <span>
              {image.faceCount} face{image.faceCount !== 1 ? 's' : ''}
            </span>
          )}
        </div>
        <p className="text-xs text-zinc-600">{timeAgo(image.uploadedAt)}</p>
        {image.errorMessage && (
          <p className="mt-1 truncate text-xs text-red-400" title={image.errorMessage}>
            {image.errorMessage}
          </p>
        )}
      </div>
    </div>
  );
}
