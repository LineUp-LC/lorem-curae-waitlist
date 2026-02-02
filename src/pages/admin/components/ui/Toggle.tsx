import { forwardRef, InputHTMLAttributes } from 'react';

// ============================================================================
// Types
// ============================================================================

export type ToggleSize = 'sm' | 'md' | 'lg';

export interface ToggleProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size' | 'type'> {
  label?: string;
  description?: string;
  size?: ToggleSize;
  error?: string;
}

// ============================================================================
// Styles
// ============================================================================

const sizeStyles: Record<ToggleSize, { track: string; thumb: string; translate: string }> = {
  sm: {
    track: 'w-8 h-4',
    thumb: 'w-3 h-3',
    translate: 'translate-x-4',
  },
  md: {
    track: 'w-10 h-5',
    thumb: 'w-4 h-4',
    translate: 'translate-x-5',
  },
  lg: {
    track: 'w-12 h-6',
    thumb: 'w-5 h-5',
    translate: 'translate-x-6',
  },
};

// ============================================================================
// Component
// ============================================================================

export const Toggle = forwardRef<HTMLInputElement, ToggleProps>(
  (
    {
      label,
      description,
      size = 'md',
      error,
      disabled,
      checked,
      className = '',
      ...props
    },
    ref
  ) => {
    const styles = sizeStyles[size];
    const hasError = Boolean(error);

    return (
      <div className={className}>
        <label className="flex items-start gap-3 cursor-pointer">
          {/* Toggle switch */}
          <div className="relative flex-shrink-0">
            <input
              ref={ref}
              type="checkbox"
              checked={checked}
              disabled={disabled}
              className="sr-only peer"
              {...props}
            />
            <div
              className={`
                ${styles.track}
                rounded-full transition-colors
                ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
                ${
                  checked
                    ? 'bg-forest-500 peer-focus:ring-2 peer-focus:ring-forest-500/30'
                    : 'bg-sage-200 peer-focus:ring-2 peer-focus:ring-sage-500/30'
                }
                ${hasError ? 'ring-2 ring-coral-500/30' : ''}
              `}
            />
            <div
              className={`
                absolute top-0.5 left-0.5
                ${styles.thumb}
                bg-white rounded-full shadow-sm
                transition-transform
                ${checked ? styles.translate : 'translate-x-0'}
              `}
            />
          </div>

          {/* Label and description */}
          {(label || description) && (
            <div className="flex-1">
              {label && (
                <span
                  className={`block text-sm font-medium ${
                    disabled ? 'text-sage-400' : 'text-sage-700'
                  }`}
                >
                  {label}
                </span>
              )}
              {description && (
                <span
                  className={`block text-xs mt-0.5 ${
                    disabled ? 'text-sage-400' : 'text-sage-500'
                  }`}
                >
                  {description}
                </span>
              )}
            </div>
          )}
        </label>

        {error && <p className="mt-1.5 text-xs text-coral-600">{error}</p>}
      </div>
    );
  }
);

Toggle.displayName = 'Toggle';

// ============================================================================
// Checkbox
// ============================================================================

export interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string;
  description?: string;
  error?: string;
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({ label, description, error, disabled, className = '', ...props }, ref) => {
    const hasError = Boolean(error);

    return (
      <div className={className}>
        <label className="flex items-start gap-3 cursor-pointer">
          <div className="relative flex-shrink-0 mt-0.5">
            <input
              ref={ref}
              type="checkbox"
              disabled={disabled}
              className={`
                w-4 h-4 rounded border-sage-300
                text-forest-600
                focus:ring-2 focus:ring-forest-500/30 focus:ring-offset-0
                disabled:opacity-50 disabled:cursor-not-allowed
                ${hasError ? 'border-coral-300' : ''}
              `}
              {...props}
            />
          </div>

          {(label || description) && (
            <div className="flex-1">
              {label && (
                <span
                  className={`block text-sm font-medium ${
                    disabled ? 'text-sage-400' : 'text-sage-700'
                  }`}
                >
                  {label}
                </span>
              )}
              {description && (
                <span
                  className={`block text-xs mt-0.5 ${
                    disabled ? 'text-sage-400' : 'text-sage-500'
                  }`}
                >
                  {description}
                </span>
              )}
            </div>
          )}
        </label>

        {error && <p className="mt-1.5 text-xs text-coral-600">{error}</p>}
      </div>
    );
  }
);

Checkbox.displayName = 'Checkbox';

export default Toggle;
