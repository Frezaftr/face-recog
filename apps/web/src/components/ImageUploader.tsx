'use client';

import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { UploadCloud, X, CheckCircle, AlertCircle } from 'lucide-react';
import { cn, formatBytes, validateImageFile } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';

// ─────────────────────────────────────────────────────────────────────────────

interface FileEntry {
  file: File;
  preview: string;
  error: string | null;
}

interface ImageUploaderProps {
  onUpload: (files: File[]) => Promise<void>;
  isUploading: boolean;
  uploadProgress: number;
  maxFiles?: number;
}

// ─────────────────────────────────────────────────────────────────────────────

export function ImageUploader({
  onUpload,
  isUploading,
  uploadProgress,
  maxFiles = 20,
}: ImageUploaderProps) {
  const [entries, setEntries] = useState<FileEntry[]>([]);

  const onDrop = useCallback(
    (accepted: File[]) => {
      const remaining = maxFiles - entries.length;
      const newFiles = accepted.slice(0, remaining).map((file) => ({
        file,
        preview: URL.createObjectURL(file),
        error: validateImageFile(file),
      }));
      setEntries((prev) => [...prev, ...newFiles]);
    },
    [entries.length, maxFiles],
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/jpeg': [], 'image/png': [], 'image/webp': [] },
    multiple: true,
    disabled: isUploading,
  });

  const remove = (index: number) => {
    setEntries((prev) => {
      URL.revokeObjectURL(prev[index].preview);
      return prev.filter((_, i) => i !== index);
    });
  };

  const validFiles = entries.filter((e) => !e.error).map((e) => e.file);

  const handleUpload = async () => {
    if (validFiles.length === 0) return;
    await onUpload(validFiles);
    // Clear previews on success
    entries.forEach((e) => URL.revokeObjectURL(e.preview));
    setEntries([]);
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Drop zone */}
      <div
        {...getRootProps()}
        className={cn(
          'flex cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed p-10 transition-colors',
          isDragActive
            ? 'border-indigo-500 bg-indigo-950/30'
            : 'border-zinc-700 bg-zinc-900/40 hover:border-zinc-500 hover:bg-zinc-900/60',
          isUploading && 'pointer-events-none opacity-60',
        )}
      >
        <input {...getInputProps()} />
        <UploadCloud className="h-10 w-10 text-zinc-400" strokeWidth={1.5} />
        <div className="text-center">
          <p className="text-sm font-medium text-zinc-200">
            {isDragActive ? 'Drop images here' : 'Drag & drop images or click to browse'}
          </p>
          <p className="mt-1 text-xs text-zinc-500">
            JPEG, PNG, WebP — up to 10 MB each, max {maxFiles} files
          </p>
        </div>
      </div>

      {/* File previews */}
      {entries.length > 0 && (
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-6">
          {entries.map((entry, i) => (
            <div key={i} className="group relative aspect-square overflow-hidden rounded-lg">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={entry.preview}
                alt={entry.file.name}
                className="h-full w-full object-cover"
              />
              {/* Overlay info */}
              <div className="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-black/70 to-transparent p-1.5 opacity-0 transition-opacity group-hover:opacity-100">
                <p className="truncate text-xs text-white">{entry.file.name}</p>
                <p className="text-xs text-zinc-400">{formatBytes(entry.file.size)}</p>
              </div>
              {/* Error indicator */}
              {entry.error && (
                <div
                  className="absolute inset-0 flex items-center justify-center bg-red-950/70"
                  title={entry.error}
                >
                  <AlertCircle className="h-6 w-6 text-red-400" />
                </div>
              )}
              {/* Remove button */}
              {!isUploading && (
                <button
                  onClick={(e) => { e.stopPropagation(); remove(i); }}
                  className="absolute right-1 top-1 rounded-full bg-black/60 p-0.5 text-white opacity-0 transition-opacity hover:bg-red-600 group-hover:opacity-100"
                  aria-label="Remove"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Upload progress */}
      {isUploading && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-zinc-400">
            <span>Uploading…</span>
            <span>{uploadProgress}%</span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-zinc-800">
            <div
              className="h-full rounded-full bg-indigo-500 transition-all duration-300"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
        </div>
      )}

      {/* Actions */}
      {entries.length > 0 && !isUploading && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-zinc-400">
            <span className="font-medium text-zinc-200">{validFiles.length}</span> valid /{' '}
            {entries.length} selected
          </p>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                entries.forEach((e) => URL.revokeObjectURL(e.preview));
                setEntries([]);
              }}
            >
              Clear all
            </Button>
            <Button
              size="sm"
              onClick={handleUpload}
              disabled={validFiles.length === 0}
            >
              <UploadCloud className="h-4 w-4" />
              Upload {validFiles.length} image{validFiles.length > 1 ? 's' : ''}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
