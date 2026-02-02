import { ReactNode } from 'react';

// ============================================================================
// Types
// ============================================================================

export interface TableColumn<T> {
  key: string;
  header: string;
  width?: string;
  align?: 'left' | 'center' | 'right';
  render?: (item: T, index: number) => ReactNode;
}

export interface TableProps<T> {
  columns: TableColumn<T>[];
  data: T[];
  keyExtractor: (item: T, index: number) => string;
  loading?: boolean;
  emptyMessage?: string;
  emptyIcon?: ReactNode;
  onRowClick?: (item: T) => void;
  selectedKey?: string | null;
  className?: string;
}

// ============================================================================
// Styles
// ============================================================================

const alignStyles = {
  left: 'text-left',
  center: 'text-center',
  right: 'text-right',
};

// ============================================================================
// Component
// ============================================================================

export function Table<T extends Record<string, unknown>>({
  columns,
  data,
  keyExtractor,
  loading = false,
  emptyMessage = 'No data available',
  emptyIcon,
  onRowClick,
  selectedKey,
  className = '',
}: TableProps<T>) {
  if (loading) {
    return (
      <div className={`overflow-x-auto ${className}`}>
        <table className="w-full">
          <thead>
            <tr className="bg-sage-50/50">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={`px-6 py-3 text-xs font-semibold text-sage-600 uppercase tracking-wider ${alignStyles[col.align || 'left']}`}
                  style={{ width: col.width }}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-sage-50">
            {[...Array(5)].map((_, rowIdx) => (
              <tr
                key={rowIdx}
                className={rowIdx % 2 === 0 ? 'bg-white' : 'bg-sage-50/30'}
              >
                {columns.map((col) => (
                  <td key={col.key} className="px-6 py-4">
                    <div className="h-4 bg-sage-100 rounded w-3/4 animate-pulse" />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  if (data.length === 0) {
    return (
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
              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
            />
          </svg>
        )}
        <p className="text-sm text-sage-500">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className={`overflow-x-auto ${className}`}>
      <table className="w-full">
        <thead>
          <tr className="bg-sage-50/50">
            {columns.map((col) => (
              <th
                key={col.key}
                className={`px-6 py-3 text-xs font-semibold text-sage-600 uppercase tracking-wider ${alignStyles[col.align || 'left']}`}
                style={{ width: col.width }}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-sage-50">
          {data.map((item, idx) => {
            const key = keyExtractor(item, idx);
            const isSelected = selectedKey === key;

            return (
              <tr
                key={key}
                onClick={onRowClick ? () => onRowClick(item) : undefined}
                className={`
                  ${idx % 2 === 0 ? 'bg-white' : 'bg-sage-50/30'}
                  ${onRowClick ? 'cursor-pointer' : ''}
                  ${isSelected ? 'bg-forest-50 ring-1 ring-inset ring-forest-200' : 'hover:bg-sage-50/50'}
                  transition-colors
                `.trim()}
              >
                {columns.map((col) => (
                  <td
                    key={col.key}
                    className={`px-6 py-4 text-sm text-sage-700 ${alignStyles[col.align || 'left']}`}
                  >
                    {col.render
                      ? col.render(item, idx)
                      : (item[col.key] as ReactNode)}
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ============================================================================
// Simple Table Components (for manual composition)
// ============================================================================

export function TableContainer({
  children,
  className = '',
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={`overflow-x-auto ${className}`}>{children}</div>;
}

export function TableRoot({
  children,
  className = '',
}: {
  children: ReactNode;
  className?: string;
}) {
  return <table className={`w-full ${className}`}>{children}</table>;
}

export function TableHead({
  children,
  className = '',
}: {
  children: ReactNode;
  className?: string;
}) {
  return <thead className={className}>{children}</thead>;
}

export function TableBody({
  children,
  className = '',
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <tbody className={`divide-y divide-sage-50 ${className}`}>{children}</tbody>
  );
}

export function TableRow({
  children,
  index,
  selected,
  onClick,
  className = '',
}: {
  children: ReactNode;
  index?: number;
  selected?: boolean;
  onClick?: () => void;
  className?: string;
}) {
  return (
    <tr
      onClick={onClick}
      className={`
        ${index !== undefined ? (index % 2 === 0 ? 'bg-white' : 'bg-sage-50/30') : 'bg-white'}
        ${onClick ? 'cursor-pointer' : ''}
        ${selected ? 'bg-forest-50 ring-1 ring-inset ring-forest-200' : 'hover:bg-sage-50/50'}
        transition-colors
        ${className}
      `.trim()}
    >
      {children}
    </tr>
  );
}

export function TableHeaderCell({
  children,
  align = 'left',
  width,
  className = '',
}: {
  children: ReactNode;
  align?: 'left' | 'center' | 'right';
  width?: string;
  className?: string;
}) {
  return (
    <th
      className={`px-6 py-3 text-xs font-semibold text-sage-600 uppercase tracking-wider bg-sage-50/50 ${alignStyles[align]} ${className}`}
      style={{ width }}
    >
      {children}
    </th>
  );
}

export function TableCell({
  children,
  align = 'left',
  className = '',
}: {
  children: ReactNode;
  align?: 'left' | 'center' | 'right';
  className?: string;
}) {
  return (
    <td className={`px-6 py-4 text-sm text-sage-700 ${alignStyles[align]} ${className}`}>
      {children}
    </td>
  );
}

export default Table;
