import { ReactNode } from 'react';

// ============================================================================
// Types
// ============================================================================

export type SpinnerSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

export interface LoadingSpinnerProps {
  size?: SpinnerSize;
  className?: string;
}

export interface LoadingStateProps {
  message?: string;
  size?: SpinnerSize;
  fullPage?: boolean;
  className?: string;
}

export interface LoadingOverlayProps {
  message?: string;
  className?: string;
}

// ============================================================================
// Styles
// ============================================================================

const sizeStyles: Record<SpinnerSize, string> = {
  xs: 'w-3 h-3',
  sm: 'w-4 h-4',
  md: 'w-6 h-6',
  lg: 'w-8 h-8',
  xl: 'w-12 h-12',
};

// ============================================================================
// Loading Spinner Component
// ============================================================================

export function LoadingSpinner({
  size = 'md',
  className = '',
}: LoadingSpinnerProps) {
  return (
    <svg
      className={`animate-spin text-forest-600 ${sizeStyles[size]} ${className}`}
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );
}

// ============================================================================
// Loading State Component
// ============================================================================

export function LoadingState({
  message = 'Loading...',
  size = 'lg',
  fullPage = false,
  className = '',
}: LoadingStateProps) {
  const content = (
    <div className={`flex flex-col items-center justify-center gap-3 ${className}`}>
      <LoadingSpinner size={size} />
      {message && <p className="text-sm text-sage-500">{message}</p>}
    </div>
  );

  if (fullPage) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-sage-50/80 z-50">
        {content}
      </div>
    );
  }

  return <div className="py-12">{content}</div>;
}

// ============================================================================
// Loading Overlay Component
// ============================================================================

export function LoadingOverlay({
  message,
  className = '',
}: LoadingOverlayProps) {
  return (
    <div
      className={`absolute inset-0 flex items-center justify-center bg-white/80 backdrop-blur-sm z-10 ${className}`}
    >
      <div className="flex flex-col items-center gap-3">
        <LoadingSpinner size="lg" />
        {message && <p className="text-sm text-sage-500">{message}</p>}
      </div>
    </div>
  );
}

// ============================================================================
// Skeleton Components
// ============================================================================

export interface SkeletonProps {
  className?: string;
  animate?: boolean;
}

export function Skeleton({ className = '', animate = true }: SkeletonProps) {
  return (
    <div
      className={`bg-sage-100 rounded ${animate ? 'animate-pulse' : ''} ${className}`}
    />
  );
}

export function SkeletonText({
  lines = 3,
  className = '',
}: {
  lines?: number;
  className?: string;
}) {
  return (
    <div className={`space-y-2 ${className}`}>
      {[...Array(lines)].map((_, i) => (
        <Skeleton
          key={i}
          className={`h-4 ${i === lines - 1 ? 'w-3/4' : 'w-full'}`}
        />
      ))}
    </div>
  );
}

export function SkeletonCard({ className = '' }: { className?: string }) {
  return (
    <div
      className={`bg-white rounded-xl border border-sage-100 p-6 ${className}`}
    >
      <div className="space-y-4">
        <Skeleton className="h-5 w-1/3" />
        <SkeletonText lines={2} />
        <div className="flex gap-2">
          <Skeleton className="h-6 w-16 rounded-full" />
          <Skeleton className="h-6 w-20 rounded-full" />
        </div>
      </div>
    </div>
  );
}

export function SkeletonTable({
  rows = 5,
  columns = 4,
  className = '',
}: {
  rows?: number;
  columns?: number;
  className?: string;
}) {
  return (
    <div className={className}>
      {/* Header */}
      <div className="flex gap-4 px-6 py-3 bg-sage-50/50">
        {[...Array(columns)].map((_, i) => (
          <Skeleton key={i} className="h-4 w-24" />
        ))}
      </div>

      {/* Rows */}
      {[...Array(rows)].map((_, rowIdx) => (
        <div
          key={rowIdx}
          className={`flex gap-4 px-6 py-4 border-b border-sage-50 ${
            rowIdx % 2 === 0 ? 'bg-white' : 'bg-sage-50/30'
          }`}
        >
          {[...Array(columns)].map((_, colIdx) => (
            <Skeleton
              key={colIdx}
              className={`h-4 ${colIdx === 0 ? 'w-32' : 'w-20'}`}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

export default LoadingSpinner;
