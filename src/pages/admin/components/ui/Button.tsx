import { forwardRef, ButtonHTMLAttributes, ReactNode } from 'react';

// ============================================================================
// Types
// ============================================================================

export type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'subtle' | 'ghost';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  icon?: ReactNode;
  iconPosition?: 'left' | 'right';
  fullWidth?: boolean;
  children?: ReactNode;
}

// ============================================================================
// Styles
// ============================================================================

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    'bg-forest-600 text-white border-forest-600 hover:bg-forest-700 hover:border-forest-700 focus:ring-forest-500/30 disabled:bg-forest-300 disabled:border-forest-300',
  secondary:
    'bg-white text-sage-700 border-sage-200 hover:bg-sage-50 hover:border-sage-300 focus:ring-sage-500/20 disabled:bg-sage-50 disabled:text-sage-400',
  danger:
    'bg-coral-600 text-white border-coral-600 hover:bg-coral-700 hover:border-coral-700 focus:ring-coral-500/30 disabled:bg-coral-300 disabled:border-coral-300',
  subtle:
    'bg-sage-100 text-sage-700 border-sage-100 hover:bg-sage-200 hover:border-sage-200 focus:ring-sage-500/20 disabled:bg-sage-50 disabled:text-sage-400',
  ghost:
    'bg-transparent text-sage-600 border-transparent hover:bg-sage-100 hover:text-sage-800 focus:ring-sage-500/20 disabled:text-sage-400',
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: 'px-3 py-1.5 text-xs gap-1.5',
  md: 'px-4 py-2 text-sm gap-2',
  lg: 'px-5 py-2.5 text-base gap-2.5',
};

const iconSizeStyles: Record<ButtonSize, string> = {
  sm: 'w-3.5 h-3.5',
  md: 'w-4 h-4',
  lg: 'w-5 h-5',
};

// ============================================================================
// Component
// ============================================================================

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'secondary',
      size = 'md',
      loading = false,
      icon,
      iconPosition = 'left',
      fullWidth = false,
      disabled,
      className = '',
      children,
      ...props
    },
    ref
  ) => {
    const isDisabled = disabled || loading;

    const baseStyles =
      'inline-flex items-center justify-center font-medium rounded-lg border transition-colors focus:outline-none focus:ring-2 disabled:cursor-not-allowed';

    const LoadingSpinner = () => (
      <svg
        className={`animate-spin ${iconSizeStyles[size]}`}
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

    const IconWrapper = ({ children }: { children: ReactNode }) => (
      <span className={iconSizeStyles[size]}>{children}</span>
    );

    return (
      <button
        ref={ref}
        disabled={isDisabled}
        className={`
          ${baseStyles}
          ${variantStyles[variant]}
          ${sizeStyles[size]}
          ${fullWidth ? 'w-full' : ''}
          ${className}
        `.trim()}
        {...props}
      >
        {loading ? (
          <LoadingSpinner />
        ) : (
          icon && iconPosition === 'left' && <IconWrapper>{icon}</IconWrapper>
        )}
        {children}
        {!loading && icon && iconPosition === 'right' && (
          <IconWrapper>{icon}</IconWrapper>
        )}
      </button>
    );
  }
);

Button.displayName = 'Button';

export default Button;
