import { ReactNode } from 'react';

// ============================================================================
// Types
// ============================================================================

export type ErrorVariant = 'inline' | 'banner' | 'fullPage' | 'card';

export interface ErrorStateProps {
  title?: string;
  message: string;
  variant?: ErrorVariant;
  onRetry?: () => void;
  retryLabel?: string;
  action?: ReactNode;
  className?: string;
}

export interface ErrorBannerProps {
  title?: string;
  message: string;
  onRetry?: () => void;
  onDismiss?: () => void;
  className?: string;
}

// ============================================================================
// Error State Component
// ============================================================================

export function ErrorState({
  title = 'Something went wrong',
  message,
  variant = 'card',
  onRetry,
  retryLabel = 'Try again',
  action,
  className = '',
}: ErrorStateProps) {
  const errorIcon = (
    <svg
      className="w-12 h-12 text-coral-400"
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
  );

  // Inline variant - compact error message
  if (variant === 'inline') {
    return (
      <div className={`flex items-center gap-2 text-coral-600 ${className}`}>
        <svg
          className="w-4 h-4 flex-shrink-0"
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path
            fillRule="evenodd"
            d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
            clipRule="evenodd"
          />
        </svg>
        <span className="text-sm">{message}</span>
        {onRetry && (
          <button
            onClick={onRetry}
            className="text-sm font-medium text-coral-700 hover:text-coral-900 underline"
          >
            {retryLabel}
          </button>
        )}
      </div>
    );
  }

  // Banner variant - horizontal alert bar
  if (variant === 'banner') {
    return (
      <div
        className={`bg-coral-50 border border-coral-200 rounded-lg p-4 ${className}`}
      >
        <div className="flex items-center gap-3">
          <svg
            className="w-5 h-5 text-coral-500 flex-shrink-0"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <div className="flex-1">
            {title && (
              <p className="text-sm font-medium text-coral-800">{title}</p>
            )}
            <p className="text-sm text-coral-600">{message}</p>
          </div>
          {onRetry && (
            <button
              onClick={onRetry}
              className="text-sm font-medium text-coral-700 hover:text-coral-900"
            >
              {retryLabel}
            </button>
          )}
          {action}
        </div>
      </div>
    );
  }

  // Full page variant - centered error with large icon
  if (variant === 'fullPage') {
    return (
      <div
        className={`flex items-center justify-center min-h-[400px] ${className}`}
      >
        <div className="text-center px-6 py-12 max-w-md">
          {errorIcon}
          <h2 className="mt-4 text-lg font-semibold text-sage-900">{title}</h2>
          <p className="mt-2 text-sm text-sage-600">{message}</p>
          {onRetry && (
            <button
              onClick={onRetry}
              className="mt-6 inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-forest-600 rounded-lg hover:bg-forest-700 transition-colors"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
              {retryLabel}
            </button>
          )}
          {action}
        </div>
      </div>
    );
  }

  // Card variant (default) - error within a card
  return (
    <div
      className={`bg-white rounded-xl border border-sage-100 shadow-sm ${className}`}
    >
      <div className="px-6 py-12 text-center">
        {errorIcon}
        <h3 className="mt-4 text-sm font-medium text-sage-700">{title}</h3>
        <p className="mt-1 text-sm text-sage-500">{message}</p>
        {onRetry && (
          <button
            onClick={onRetry}
            className="mt-4 inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-sage-700 bg-sage-100 rounded-lg hover:bg-sage-200 transition-colors"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
            {retryLabel}
          </button>
        )}
        {action}
      </div>
    </div>
  );
}

// ============================================================================
// Error Banner (dismissible)
// ============================================================================

export function ErrorBanner({
  title,
  message,
  onRetry,
  onDismiss,
  className = '',
}: ErrorBannerProps) {
  return (
    <div
      className={`bg-coral-50 border border-coral-200 rounded-lg p-4 ${className}`}
    >
      <div className="flex items-start gap-3">
        <svg
          className="w-5 h-5 text-coral-500 flex-shrink-0 mt-0.5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        <div className="flex-1">
          {title && (
            <p className="text-sm font-medium text-coral-800">{title}</p>
          )}
          <p className="text-sm text-coral-600">{message}</p>
          {onRetry && (
            <button
              onClick={onRetry}
              className="mt-2 inline-flex items-center gap-1.5 text-sm font-medium text-coral-700 hover:text-coral-900"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
              Try again
            </button>
          )}
        </div>
        {onDismiss && (
          <button
            onClick={onDismiss}
            className="p-1 text-coral-400 hover:text-coral-600 rounded transition-colors"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// Warning Banner
// ============================================================================

export function WarningBanner({
  title,
  message,
  action,
  className = '',
}: {
  title?: string;
  message: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`bg-amber-50 border border-amber-200 rounded-lg p-4 ${className}`}
    >
      <div className="flex items-start gap-3">
        <svg
          className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
          />
        </svg>
        <div className="flex-1">
          {title && (
            <p className="text-sm font-medium text-amber-800">{title}</p>
          )}
          <p className="text-sm text-amber-700">{message}</p>
        </div>
        {action}
      </div>
    </div>
  );
}

// ============================================================================
// Info Banner
// ============================================================================

export function InfoBanner({
  title,
  message,
  action,
  className = '',
}: {
  title?: string;
  message: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`bg-sky-50 border border-sky-200 rounded-lg p-4 ${className}`}
    >
      <div className="flex items-start gap-3">
        <svg
          className="w-5 h-5 text-sky-500 flex-shrink-0 mt-0.5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        <div className="flex-1">
          {title && (
            <p className="text-sm font-medium text-sky-800">{title}</p>
          )}
          <p className="text-sm text-sky-700">{message}</p>
        </div>
        {action}
      </div>
    </div>
  );
}

export default ErrorState;
