import { forwardRef, SelectHTMLAttributes, ReactNode } from 'react';

// ============================================================================
// Types
// ============================================================================

export type SelectSize = 'sm' | 'md' | 'lg';

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'size'> {
  label?: string;
  error?: string;
  hint?: string;
  size?: SelectSize;
  options: SelectOption[];
  placeholder?: string;
  fullWidth?: boolean;
}

// ============================================================================
// Styles
// ============================================================================

const sizeStyles: Record<SelectSize, string> = {
  sm: 'px-3 py-1.5 text-xs pr-8',
  md: 'px-3 py-2 text-sm pr-10',
  lg: 'px-4 py-2.5 text-base pr-12',
};

// ============================================================================
// Component
// ============================================================================

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  (
    {
      label,
      error,
      hint,
      size = 'md',
      options,
      placeholder,
      fullWidth = false,
      className = '',
      disabled,
      ...props
    },
    ref
  ) => {
    const hasError = Boolean(error);

    const baseStyles = `
      block rounded-lg border bg-white text-sage-800
      appearance-none cursor-pointer
      focus:outline-none focus:ring-2
      disabled:bg-sage-50 disabled:text-sage-500 disabled:cursor-not-allowed
      transition-colors
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

        <div className="relative">
          <select
            ref={ref}
            disabled={disabled}
            className={`
              ${baseStyles}
              ${stateStyles}
              ${sizeStyles[size]}
              ${fullWidth ? 'w-full' : ''}
              ${className}
            `.trim()}
            {...props}
          >
            {placeholder && (
              <option value="" disabled>
                {placeholder}
              </option>
            )}
            {options.map((option) => (
              <option
                key={option.value}
                value={option.value}
                disabled={option.disabled}
              >
                {option.label}
              </option>
            ))}
          </select>

          {/* Dropdown arrow */}
          <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
            <svg
              className="w-4 h-4 text-sage-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </div>
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

Select.displayName = 'Select';

// ============================================================================
// Filter Select (simplified for filter bars)
// ============================================================================

export interface FilterSelectProps<T extends string> {
  label: string;
  value: T;
  options: { value: T; label: string }[];
  onChange: (value: T) => void;
  className?: string;
}

export function FilterSelect<T extends string>({
  label,
  value,
  options,
  onChange,
  className = '',
}: FilterSelectProps<T>) {
  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      <label className="text-xs font-medium text-sage-600">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as T)}
        className="px-3 py-2 text-sm bg-white border border-sage-200 rounded-lg text-sage-800 focus:outline-none focus:ring-2 focus:ring-forest-500/20 focus:border-forest-500"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}

export default Select;
