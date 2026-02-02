import { ReactNode } from 'react';

// ============================================================================
// Types
// ============================================================================

export type CardVariant = 'default' | 'warning' | 'error' | 'success' | 'info';

export interface CardProps {
  variant?: CardVariant;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  className?: string;
  children: ReactNode;
}

export interface CardHeaderProps {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  className?: string;
}

export interface CardBodyProps {
  padding?: 'none' | 'sm' | 'md' | 'lg';
  className?: string;
  children: ReactNode;
}

export interface CardFooterProps {
  className?: string;
  children: ReactNode;
}

// ============================================================================
// Styles
// ============================================================================

const variantStyles: Record<CardVariant, string> = {
  default: 'bg-white border-sage-100',
  warning: 'bg-amber-50 border-amber-200',
  error: 'bg-coral-50 border-coral-200',
  success: 'bg-forest-50 border-forest-200',
  info: 'bg-sky-50 border-sky-200',
};

const paddingStyles: Record<'none' | 'sm' | 'md' | 'lg', string> = {
  none: '',
  sm: 'p-4',
  md: 'p-5',
  lg: 'p-6',
};

// ============================================================================
// Components
// ============================================================================

export function Card({
  variant = 'default',
  padding = 'none',
  className = '',
  children,
}: CardProps) {
  return (
    <div
      className={`
        rounded-xl border shadow-sm overflow-hidden
        ${variantStyles[variant]}
        ${paddingStyles[padding]}
        ${className}
      `.trim()}
    >
      {children}
    </div>
  );
}

export function CardHeader({
  title,
  subtitle,
  action,
  className = '',
}: CardHeaderProps) {
  return (
    <div className={`px-6 py-4 border-b border-sage-100 ${className}`}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-lg font-medium text-sage-800">{title}</h3>
          {subtitle && (
            <p className="text-sm text-sage-500 mt-0.5">{subtitle}</p>
          )}
        </div>
        {action && <div>{action}</div>}
      </div>
    </div>
  );
}

export function CardBody({
  padding = 'md',
  className = '',
  children,
}: CardBodyProps) {
  return (
    <div className={`${paddingStyles[padding]} ${className}`}>{children}</div>
  );
}

export function CardFooter({ className = '', children }: CardFooterProps) {
  return (
    <div
      className={`px-6 py-4 bg-sage-50/50 border-t border-sage-100 ${className}`}
    >
      {children}
    </div>
  );
}

// ============================================================================
// Section Card (common pattern)
// ============================================================================

export interface SectionCardProps {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  loading?: boolean;
  error?: string | null;
  isEmpty?: boolean;
  emptyMessage?: string;
  emptyIcon?: ReactNode;
  children: ReactNode;
  className?: string;
}

export function SectionCard({
  title,
  subtitle,
  action,
  loading,
  error,
  isEmpty,
  emptyMessage = 'No data available',
  emptyIcon,
  children,
  className = '',
}: SectionCardProps) {
  return (
    <Card className={className}>
      <CardHeader title={title} subtitle={subtitle} action={action} />

      {error ? (
        <CardBody>
          <div className="flex items-center gap-3 text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3">
            <svg
              className="w-5 h-5 flex-shrink-0"
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
            <div>
              <p className="text-sm font-medium">Failed to load</p>
              <p className="text-xs text-amber-500 mt-0.5">{error}</p>
            </div>
          </div>
        </CardBody>
      ) : loading ? (
        <CardBody>
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex gap-4">
                <div className="h-4 bg-sage-100 rounded w-32 animate-pulse" />
                <div className="h-4 bg-sage-100 rounded w-48 animate-pulse" />
                <div className="h-4 bg-sage-100 rounded w-24 animate-pulse" />
              </div>
            ))}
          </div>
        </CardBody>
      ) : isEmpty ? (
        <div className="px-6 py-12 text-center">
          {emptyIcon || (
            <svg
              className="w-12 h-12 mx-auto mb-3 text-sage-300"
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
          )}
          <p className="text-sm text-sage-500">{emptyMessage}</p>
        </div>
      ) : (
        children
      )}
    </Card>
  );
}

export default Card;
