import { ReactNode } from 'react';

// ============================================================================
// Types
// ============================================================================

export interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

// ============================================================================
// Styles
// ============================================================================

const sizeStyles = {
  sm: {
    title: 'text-sm font-semibold text-sage-700',
    subtitle: 'text-xs text-sage-500 mt-0.5',
  },
  md: {
    title: 'text-base font-semibold text-sage-800',
    subtitle: 'text-sm text-sage-500 mt-0.5',
  },
  lg: {
    title: 'text-lg font-semibold text-sage-800',
    subtitle: 'text-sm text-sage-500 mt-1',
  },
};

// ============================================================================
// Component
// ============================================================================

export function SectionHeader({
  title,
  subtitle,
  action,
  size = 'md',
  className = '',
}: SectionHeaderProps) {
  const styles = sizeStyles[size];

  return (
    <div className={`flex items-start justify-between gap-4 ${className}`}>
      <div>
        <h3 className={styles.title}>{title}</h3>
        {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
      </div>
      {action && <div className="flex-shrink-0">{action}</div>}
    </div>
  );
}

// ============================================================================
// Section Divider
// ============================================================================

export interface SectionDividerProps {
  label?: string;
  className?: string;
}

export function SectionDivider({ label, className = '' }: SectionDividerProps) {
  if (!label) {
    return <hr className={`border-sage-200 ${className}`} />;
  }

  return (
    <div className={`relative ${className}`}>
      <div className="absolute inset-0 flex items-center">
        <div className="w-full border-t border-sage-200" />
      </div>
      <div className="relative flex justify-center">
        <span className="px-3 bg-white text-xs font-medium text-sage-500 uppercase tracking-wider">
          {label}
        </span>
      </div>
    </div>
  );
}

export default SectionHeader;
