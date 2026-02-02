import { ReactNode } from 'react';
import { Link } from 'react-router-dom';

// ============================================================================
// Types
// ============================================================================

export interface PageHeaderProps {
  title: string;
  subtitle?: string;
  backLink?: string;
  backLabel?: string;
  actions?: ReactNode;
  badge?: ReactNode;
  className?: string;
}

// ============================================================================
// Component
// ============================================================================

export function PageHeader({
  title,
  subtitle,
  backLink,
  backLabel,
  actions,
  badge,
  className = '',
}: PageHeaderProps) {
  return (
    <div className={`flex items-start justify-between gap-4 ${className}`}>
      <div>
        {/* Back link */}
        {backLink && (
          <Link
            to={backLink}
            className="inline-flex items-center gap-1.5 text-sm text-sage-500 hover:text-sage-700 mb-2 transition-colors"
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
                d="M10 19l-7-7m0 0l7-7m-7 7h18"
              />
            </svg>
            {backLabel || 'Back'}
          </Link>
        )}

        {/* Title row */}
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-semibold text-sage-900">{title}</h1>
          {badge}
        </div>

        {/* Subtitle */}
        {subtitle && (
          <p className="mt-1 text-sage-500">{subtitle}</p>
        )}
      </div>

      {/* Actions */}
      {actions && (
        <div className="flex items-center gap-3 flex-shrink-0">{actions}</div>
      )}
    </div>
  );
}

// ============================================================================
// Page Header with Tabs
// ============================================================================

export interface PageHeaderTab {
  key: string;
  label: string;
  count?: number;
}

export interface PageHeaderWithTabsProps extends Omit<PageHeaderProps, 'children'> {
  tabs: PageHeaderTab[];
  activeTab: string;
  onTabChange: (key: string) => void;
}

export function PageHeaderWithTabs({
  tabs,
  activeTab,
  onTabChange,
  ...props
}: PageHeaderWithTabsProps) {
  return (
    <div className="space-y-4">
      <PageHeader {...props} />

      <div className="border-b border-sage-200">
        <nav className="flex gap-6">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => onTabChange(tab.key)}
              className={`
                relative pb-3 text-sm font-medium transition-colors
                ${
                  activeTab === tab.key
                    ? 'text-forest-700'
                    : 'text-sage-500 hover:text-sage-700'
                }
              `}
            >
              <span className="flex items-center gap-2">
                {tab.label}
                {tab.count !== undefined && (
                  <span
                    className={`
                      px-1.5 py-0.5 rounded-full text-xs
                      ${
                        activeTab === tab.key
                          ? 'bg-forest-100 text-forest-700'
                          : 'bg-sage-100 text-sage-600'
                      }
                    `}
                  >
                    {tab.count}
                  </span>
                )}
              </span>

              {activeTab === tab.key && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-forest-500 rounded-t" />
              )}
            </button>
          ))}
        </nav>
      </div>
    </div>
  );
}

export default PageHeader;
