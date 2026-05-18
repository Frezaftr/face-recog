'use client';

import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { SearchIcon, X } from 'lucide-react';
import { cn, validateImageFile } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { SearchResults } from '@/components/SearchResults';
import { useSearch } from '@/lib/hooks/useSearch';

export default function SearchPage() {
  const { search, results, clearResults, isSearching, queryProgress } = useSearch();
  const [queryFile, setQueryFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [topK, setTopK] = useState(10);
  const [fileError, setFileError] = useState<string | null>(null);

  const onDrop = useCallback((accepted: File[]) => {
    const file = accepted[0];
    if (!file) return;
    const err = validateImageFile(file);
    if (err) { setFileError(err); return; }
    setFileError(null);
    if (preview) URL.revokeObjectURL(preview);
    setQueryFile(file);
    setPreview(URL.createObjectURL(file));
    clearResults();
  }, [preview, clearResults]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/jpeg': [], 'image/png': [], 'image/webp': [] },
    multiple: false,
    disabled: isSearching,
  });

  const handleSearch = async () => {
    if (!queryFile) return;
    await search(queryFile, topK);
  };

  const handleClear = () => {
    if (preview) URL.revokeObjectURL(preview);
    setQueryFile(null);
    setPreview(null);
    setFileError(null);
    clearResults();
  };

  return (
    <div className="space-y-10">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-zinc-100">Face Search</h1>
        <p className="mt-1 text-sm text-zinc-400">
          Upload a query image containing a face to find all matching images.
        </p>
      </div>

      {/* Query area */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Drop zone */}
        <div className="space-y-3">
          <label className="text-sm font-medium text-zinc-300">Query image</label>

          {!queryFile ? (
            <div
              {...getRootProps()}
              className={cn(
                'flex cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed p-10 transition-colors',
                isDragActive
                  ? 'border-indigo-500 bg-indigo-950/30'
                  : 'border-zinc-700 bg-zinc-900/40 hover:border-zinc-500',
                isSearching && 'pointer-events-none opacity-60',
              )}
            >
              <input {...getInputProps()} />
              <SearchIcon className="h-8 w-8 text-zinc-400" strokeWidth={1.5} />
              <div className="text-center">
                <p className="text-sm text-zinc-200">
                  {isDragActive ? 'Drop your query image' : 'Drop a face image here'}
                </p>
                <p className="mt-1 text-xs text-zinc-500">JPEG, PNG, WebP</p>
              </div>
            </div>
          ) : (
            <div className="relative aspect-video overflow-hidden rounded-2xl border border-zinc-700 bg-zinc-900">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={preview!}
                alt="Query"
                className="h-full w-full object-contain"
              />
              <button
                onClick={handleClear}
                className="absolute right-2 top-2 rounded-full bg-black/60 p-1 text-white hover:bg-red-600 transition-colors"
                aria-label="Remove query image"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )}

          {fileError && <p className="text-xs text-red-400">{fileError}</p>}
        </div>

        {/* Controls */}
        <div className="flex flex-col gap-4 justify-center">
          <div className="space-y-1">
            <label className="text-sm font-medium text-zinc-300" htmlFor="topk">
              Top-K results: <span className="text-indigo-400 font-bold">{topK}</span>
            </label>
            <input
              id="topk"
              type="range"
              min={1}
              max={50}
              value={topK}
              onChange={(e) => setTopK(Number(e.target.value))}
              disabled={isSearching}
              className="w-full accent-indigo-500"
            />
            <div className="flex justify-between text-xs text-zinc-500">
              <span>1</span>
              <span>50</span>
            </div>
          </div>

          {isSearching && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-zinc-400">
                <span className="flex items-center gap-1.5">
                  <Spinner size="sm" /> Searching…
                </span>
                <span>{queryProgress}%</span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-zinc-800">
                <div
                  className="h-full rounded-full bg-indigo-500 transition-all"
                  style={{ width: `${queryProgress}%` }}
                />
              </div>
            </div>
          )}

          <Button
            size="lg"
            onClick={handleSearch}
            disabled={!queryFile}
            isLoading={isSearching}
            className="w-full"
          >
            <SearchIcon className="h-4 w-4" />
            Search
          </Button>
        </div>
      </div>

      {/* Results */}
      {results && (
        <div className="space-y-4 animate-fade-in">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-zinc-300">Search Results</h2>
            <Button variant="ghost" size="sm" onClick={clearResults}>
              <X className="h-3.5 w-3.5" /> Clear
            </Button>
          </div>
          <SearchResults
            results={results.results}
            latencyMs={results.latencyMs}
            queryFaceCount={results.queryFaceCount}
          />
        </div>
      )}
    </div>
  );
}
