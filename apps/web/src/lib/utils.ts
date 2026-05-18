import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { formatDistanceToNow } from 'date-fns';

// ── Tailwind class merging ────────────────────────────────────────────────────
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

// ── Byte formatting ───────────────────────────────────────────────────────────
export function formatBytes(bytes: number, decimals = 2): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const dm = Math.max(0, decimals);
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

// ── Relative time ─────────────────────────────────────────────────────────────
export function timeAgo(dateStr: string): string {
  return formatDistanceToNow(new Date(dateStr), { addSuffix: true });
}

// ── Similarity to percentage ──────────────────────────────────────────────────
export function similarityToPercent(score: number): string {
  return `${Math.round(score * 100)}%`;
}

// ── Similarity colour ─────────────────────────────────────────────────────────
export function similarityColor(score: number): string {
  if (score >= 0.85) return 'text-green-400';
  if (score >= 0.70) return 'text-yellow-400';
  return 'text-red-400';
}

// ── File validation ───────────────────────────────────────────────────────────
const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
const MAX_FILE_SIZE_MB = 10;

export function validateImageFile(file: File): string | null {
  if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
    return `Unsupported type: ${file.type}. Use JPEG, PNG, or WebP.`;
  }
  if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
    return `File too large (max ${MAX_FILE_SIZE_MB} MB).`;
  }
  return null;
}
