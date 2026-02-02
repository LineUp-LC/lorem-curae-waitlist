import { forwardRef, InputHTMLAttributes, ReactNode } from 'react';

// ============================================================================
// Types
// ============================================================================

export type InputSize = 'sm' | 'md' | 'lg';

export interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label?: string;
  error?: string;
  hint?: string;
  size?: InputSize;
  icon?: ReactNode;
  iconPosition?: 'left' | 'right';
  fullWidth?: boolean;
}

// ============================================================================
// Styles
// ============================================================================

const sizeStyles: Record<InputSize, { input: string; icon: string }> = {
  sm: {
    input: 'px-3 py-1.5 text-xs',
    icon: 'w-4 h-4',
  },
  md: {
    input: 'px-3 py-2 text-sm',
    icon: 'w-4 h-4',
  },
  lg: {
    input: 'px-4 py-2.5 text-base',
    icon: 'w-5 h-5',
  },
};

// ============================================================================
// Component
// ============================================================================

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      error,
      hint,
      size = 'md',
      icon,
      iconPosition = 'left',
      fullWidth = false,
      className = '',
      disabled,
      ...props
    },
    ref
  ) => {
    const hasError = Boolean(error);
    const styles = sizeStyles[size];

    const baseInputStyles = `
      block rounded-lg border bg-white text-sage-800
      placeholder:text-sage-400
      focus:outline-none focus:ring-2
      disabled:bg-sage-50 disabled:text-sage-500 disabled:cursor-not-allowed
      transition-colors
    `;

    const stateStyles = hasError
      ? 'border-coral-300 focus:border-coral-500 focus:ring-coral-500/20'
      : 'border-sage-200 focus:border-forest-500 focus:ring-forest-500/20';

    const iconPaddingStyles = icon
      ? iconPosition === 'left'
        ? 'pl-10'
        : 'pr-10'
      : '';

    return (
      <div className={fullWidth ? 'w-full' : ''}>
        {label && (
          <label className="block text-sm font-medium text-sage-700 mb-1.5">
            {label}
          </label>
        )}

        <div className="relative">
          {icon && (
            <div
              className={`
                absolute top-1/2 -translate-y-1/2 text-sage-400
                ${iconPosition === 'left' ? 'left-3' : 'right-3'}
              `}
            >
              <span className={styles.icon}>{icon}</span>
            </div>
          )}

          <input
            ref={ref}
            disabled={disabled}
            className={`
              ${baseInputStyles}
              ${stateStyles}
              ${styles.input}
              ${iconPaddingStyles}
              ${fullWidth ? 'w-full' : ''}
              ${className}
            `.trim()}
            {...props}
          />
        </div>

        {(error || hint) && (
          <p
            className={`mt-1.5 text-xs ${
              hasError ? 'text-coral-600' : 'text-sage-500'
            }`}
          >
            {error || hint}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

// ============================================================================
// Textarea
// ============================================================================

export interface TextareaProps
  extends Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, 'size'> {
  label?: string;
  error?: string;
  hint?: string;
  fullWidth?: boolean;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    { label, error, hint, fullWidth = false, className = '', disabled, ...props },
    ref
  ) => {
    const hasError = Boolean(error);

    const baseStyles = `
      block rounded-lg border bg-white text-sage-800 px-3 py-2 text-sm
      placeholder:text-sage-400
      focus:outline-none focus:ring-2
      disabled:bg-sage-50 disabled:text-sage-500 disabled:cursor-not-allowed
      transition-colors resize-y min-h-[100px]
    `;

    const stateStyles = hasError
      ? 'border-coral-300 focus:border-coral-500 focus:ring-coral-500/20'
      : 'border-sage-200 focus:border-forest-500 focus:ring-forest-500/20';

    return (
      <div className={fullWidth ? 'w-full' : ''}>
        {label && (
          <label className="block text-sm font-medium text-sage-700 mb-1.5">
            {label}
          </label>
        )}

        <textarea
          ref={ref}
          disabled={disabled}
          className={`
            ${baseStyles}
            ${stateStyles}
            ${fullWidth ? 'w-full' : ''}
            ${className}
          `.trim()}
          {...props}
        />

        {(error || hint) && (
          <p
            className={`mt-1.5 text-xs ${
              hasError ? 'text-coral-600' : 'text-sage-500'
            }`}
          >
            {error || hint}
          </p>
        )}
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';

export default Input;
