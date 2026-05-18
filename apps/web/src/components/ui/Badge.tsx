import { cn } from '@/lib/utils';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info';
  className?: string;
}

const variantClasses: Record<NonNullable<BadgeProps['variant']>, string> = {
  default: 'bg-zinc-700 text-zinc-200',
  success: 'bg-green-900/50 text-green-400 border border-green-800',
  warning: 'bg-yellow-900/50 text-yellow-400 border border-yellow-800',
  error: 'bg-red-900/50 text-red-400 border border-red-800',
  info: 'bg-blue-900/50 text-blue-400 border border-blue-800',
};

export function Badge({ children, variant = 'default', className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
        variantClasses[variant],
        className,
      )}
    >
      {children}
    </span>
  );
}

// ── Status badge for ImageStatus ──────────────────────────────────────────────
import type { ImageStatus } from '@/lib/types';

const statusVariant: Record<ImageStatus, BadgeProps['variant']> = {
  pending: 'info',
  processing: 'warning',
  done: 'success',
  failed: 'error',
};

export function StatusBadge({ status }: { status: ImageStatus }) {
  return <Badge variant={statusVariant[status]}>{status}</Badge>;
}
