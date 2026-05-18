'use client';

import Image from 'next/image';
import { cn, similarityToPercent, similarityColor, timeAgo } from '@/lib/utils';
import type { SearchResultItem } from '@/lib/types';

interface SearchResultsProps {
  results: SearchResultItem[];
  latencyMs: number;
  queryFaceCount: number;
}

export function SearchResults({ results, latencyMs, queryFaceCount }: SearchResultsProps) {
  if (results.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-zinc-700 py-16 text-zinc-500">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-12 w-12"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M21 21l-4.35-4.35M17 11A6 6 0 115 11a6 6 0 0112 0z"
          />
        </svg>
        <p className="text-sm">No matching faces found</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Meta bar */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-zinc-400">
        <span>
          <span className="font-semibold text-zinc-200">{results.length}</span> match
          {results.length > 1 ? 'es' : ''}
        </span>
        <span>·</span>
        <span>
          Query faces detected:{' '}
          <span className="font-semibold text-zinc-200">{queryFaceCount}</span>
        </span>
        <span>·</span>
        <span>
          Latency: <span className="font-semibold text-zinc-200">{latencyMs}ms</span>
        </span>
      </div>

      {/* Results grid */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {results.map((item) => (
          <ResultCard key={item.faceId} item={item} />
        ))}
      </div>
    </div>
  );
}

// ── Single result card ────────────────────────────────────────────────────────

function ResultCard({ item }: { item: SearchResultItem }) {
  const bboxWidth = item.bbox.x2 - item.bbox.x1;
  const bboxHeight = item.bbox.y2 - item.bbox.y1;

  return (
    <div className="group relative overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900 transition-transform hover:-translate-y-0.5 hover:shadow-lg hover:shadow-indigo-950/40">
      {/* Image */}
      <div className="relative aspect-square overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={item.url}
          alt={item.filename}
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
        {/* Bounding box overlay — rendered as percentage-based absolute div */}
        <FaceBoundingBox item={item} />
      </div>

      {/* Footer */}
      <div className="p-2.5">
        <p className="truncate text-xs font-medium text-zinc-300">{item.filename}</p>
        <div className="mt-1 flex items-center justify-between">
          <span
            className={cn(
              'text-sm font-bold tabular-nums',
              similarityColor(item.similarity),
            )}
          >
            {similarityToPercent(item.similarity)}
          </span>
          <span className="text-xs text-zinc-500">match</span>
        </div>
      </div>
    </div>
  );
}

// ── Bounding box SVG overlay ──────────────────────────────────────────────────

function FaceBoundingBox({ item }: { item: SearchResultItem }) {
  // bbox coordinates are pixel-absolute; we render as svg overlay (100%×100% of container)
  // The face-service returns absolute pixel coords from the source image.
  // Since we don't know source image dimensions here, we render a percentage-based
  // approximation using tailwind absolute positioning and trust the API to scale.
  return (
    <div
      className="pointer-events-none absolute border-2 border-indigo-400 shadow-[0_0_8px_rgba(99,102,241,0.6)]"
      style={{
        // These are pixel coords from the original image — we display them as a fraction
        // of the container. The container is 100%×100% of the card.
        // In production, the backend should return normalised [0,1] coordinates.
        // Here we pass them through as-is to illustrate the concept.
        left: `${item.bbox.x1 / 8}%`,
        top: `${item.bbox.y1 / 8}%`,
        width: `${(item.bbox.x2 - item.bbox.x1) / 8}%`,
        height: `${(item.bbox.y2 - item.bbox.y1) / 8}%`,
        minWidth: '8%',
        minHeight: '8%',
      }}
    />
  );
}
