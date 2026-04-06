import { ReactNode } from 'react';

// ============================================================================
// Types
// ============================================================================

export type EmptyStateVariant = 'default' | 'search' | 'error' | 'success';

export interface EmptyStateProps {
  title?: string;
  message: string;
  icon?: ReactNode;
  variant?: EmptyStateVariant;
  action?: ReactNode;
  compact?: boolean;
  className?: string;
}

// ============================================================================
// Default Icons
// ============================================================================

const defaultIcons: Record<EmptyStateVariant, ReactNode> = {
  default: (
    <svg
      className="w-12 h-12 text-sage-300"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
      />
    </svg>
  ),
  search: (
    <svg
      className="w-12 h-12 text-sage-300"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
      />
    </svg>
  ),
  error: (
    <svg
      className="w-12 h-12 text-coral-300"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
      />
    </svg>
  ),
  success: (
    <svg
      className="w-12 h-12 text-forest-300"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  ),
};

// ============================================================================
// Component
// ============================================================================

export function EmptyState({
  title,
  message,
  icon,
  variant = 'default',
  action,
  compact = false,
  className = '',
}: EmptyStateProps) {
  return (
    <div
      className={`
        text-center
        ${compact ? 'px-4 py-8' : 'px-6 py-12'}
        ${className}
      `}
    >
      <div className="flex justify-center mb-4">
        {icon || defaultIcons[variant]}
      </div>

      {title && (
        <h3 className="text-sm font-medium text-sage-700 mb-1">{title}</h3>
      )}

      <p className="text-sm text-sage-500">{message}</p>

      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

// ============================================================================
// Preset Empty States
// ============================================================================

export function NoDataEmptyState({
  message = 'No data available',
  action,
}: {
  message?: string;
  action?: ReactNode;
}) {
  return <EmptyState message={message} variant="default" action={action} />;
}

export function NoResultsEmptyState({
  message = 'No results found',
  action,
}: {
  message?: string;
  action?: ReactNode;
}) {
  return (
    <EmptyState
      title="No results"
      message={message}
      variant="search"
      action={action}
    />
  );
}

export function AllCaughtUpEmptyState({
  message = "You're all caught up!",
}: {
  message?: string;
}) {
  return <EmptyState message={message} variant="success" />;
}

export default EmptyState;
