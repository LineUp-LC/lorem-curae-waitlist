import { ReactNode } from 'react';

// ============================================================================
// Types
// ============================================================================

export type BadgeVariant =
  | 'default'
  | 'success'
  | 'warning'
  | 'error'
  | 'info'
  | 'critical'
  | 'purple'
  | 'sky';

export type BadgeSize = 'sm' | 'md';

export interface BadgeProps {
  variant?: BadgeVariant;
  size?: BadgeSize;
  dot?: boolean;
  icon?: ReactNode;
  children: ReactNode;
  className?: string;
}

// ============================================================================
// Styles
// ============================================================================

const variantStyles: Record<BadgeVariant, { bg: string; text: string; border: string; dot: string }> = {
  default: {
    bg: 'bg-sage-100',
    text: 'text-sage-700',
    border: 'border-sage-200',
    dot: 'bg-sage-500',
  },
  success: {
    bg: 'bg-forest-50',
    text: 'text-forest-700',
    border: 'border-forest-200',
    dot: 'bg-forest-500',
  },
  warning: {
    bg: 'bg-amber-50',
    text: 'text-amber-700',
    border: 'border-amber-200',
    dot: 'bg-amber-500',
  },
  error: {
    bg: 'bg-coral-50',
    text: 'text-coral-700',
    border: 'border-coral-200',
    dot: 'bg-coral-500',
  },
  info: {
    bg: 'bg-sky-50',
    text: 'text-sky-700',
    border: 'border-sky-200',
    dot: 'bg-sky-500',
  },
  critical: {
    bg: 'bg-red-100',
    text: 'text-red-800',
    border: 'border-red-300',
    dot: 'bg-red-600',
  },
  purple: {
    bg: 'bg-purple-50',
    text: 'text-purple-700',
    border: 'border-purple-200',
    dot: 'bg-purple-500',
  },
  sky: {
    bg: 'bg-sky-50',
    text: 'text-sky-700',
    border: 'border-sky-200',
    dot: 'bg-sky-500',
  },
};

const sizeStyles: Record<BadgeSize, string> = {
  sm: 'px-1.5 py-0.5 text-[10px]',
  md: 'px-2.5 py-1 text-xs',
};

// ============================================================================
// Component
// ============================================================================

export function Badge({
  variant = 'default',
  size = 'md',
  dot = false,
  icon,
  children,
  className = '',
}: BadgeProps) {
  const styles = variantStyles[variant];

  return (
    <span
      className={`
        inline-flex items-center gap-1.5 rounded-full font-medium border
        ${styles.bg} ${styles.text} ${styles.border}
        ${sizeStyles[size]}
        ${className}
      `.trim()}
    >
      {dot && (
        <span className={`w-1.5 h-1.5 rounded-full ${styles.dot}`} />
      )}
      {icon && <span className="w-3.5 h-3.5">{icon}</span>}
      {children}
    </span>
  );
}

// ============================================================================
// Preset Badges
// ============================================================================

// Status badges
export function StatusBadge({ status }: { status: string }) {
  const getVariant = (): BadgeVariant => {
    const s = status.toLowerCase();
    if (s === 'active' || s === 'resolved' || s === 'healthy' || s === 'ok') return 'success';
    if (s === 'pending' || s === 'investigating' || s === 'warning' || s === 'degraded') return 'warning';
    if (s === 'disabled' || s === 'failed' || s === 'error' || s === 'unhealthy') return 'error';
    if (s === 'open' || s === 'critical') return 'critical';
    return 'default';
  };

  const formatStatus = (s: string) =>
    s.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

  return (
    <Badge variant={getVariant()} dot>
      {formatStatus(status)}
    </Badge>
  );
}

// Severity badges
export function SeverityBadge({ severity }: { severity: string }) {
  const getVariant = (): BadgeVariant => {
    switch (severity.toLowerCase()) {
      case 'low':
        return 'success';
      case 'medium':
        return 'warning';
      case 'high':
        return 'error';
      case 'critical':
        return 'critical';
      case 'info':
        return 'info';
      case 'warning':
        return 'warning';
      case 'error':
        return 'error';
      default:
        return 'default';
    }
  };

  const formatSeverity = (s: string) =>
    s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();

  return (
    <Badge variant={getVariant()} dot>
      {formatSeverity(severity)}
    </Badge>
  );
}

// Category badges
export function CategoryBadge({ category }: { category: string }) {
  const getVariant = (): BadgeVariant => {
    switch (category.toLowerCase()) {
      case 'incident':
        return 'error';
      case 'email':
        return 'purple';
      case 'rate_limit':
        return 'warning';
      case 'health':
        return 'success';
      case 'system':
        return 'default';
      case 'admin_action':
      case 'admin':
        return 'purple';
      case 'user':
        return 'success';
      default:
        return 'default';
    }
  };

  const formatCategory = (c: string) =>
    c.replace(/_/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase());

  return <Badge variant={getVariant()}>{formatCategory(category)}</Badge>;
}

// Boolean badge
export function BooleanBadge({
  value,
  trueLabel = 'Yes',
  falseLabel = 'No',
}: {
  value: boolean;
  trueLabel?: string;
  falseLabel?: string;
}) {
  return (
    <Badge variant={value ? 'success' : 'default'} dot>
      {value ? trueLabel : falseLabel}
    </Badge>
  );
}

export default Badge;
