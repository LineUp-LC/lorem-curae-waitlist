interface StatCardProps {
  title: string;
  value: string | number;
  description?: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  isLoading?: boolean;
  isPlaceholder?: boolean;
}

export function StatCard({
  title,
  value,
  description,
  trend,
  isLoading = false,
  isPlaceholder = false,
}: StatCardProps) {
  return (
    <div className="bg-white rounded-xl border border-sage-100 p-6 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div className="space-y-1 flex-1">
          <p className="text-sm font-medium text-sage-500">{title}</p>
          {isLoading ? (
            <div className="h-9 bg-sage-100 rounded w-24 animate-pulse" />
          ) : (
            <p
              className={`text-3xl font-semibold tracking-tight ${
                isPlaceholder ? 'text-sage-300' : 'text-sage-900'
              }`}
            >
              {value}
            </p>
          )}
        </div>
        {trend && !isLoading && !isPlaceholder && (
          <span
            className={`inline-flex items-center gap-1 text-sm font-medium px-2 py-1 rounded-full ${
              trend.isPositive
                ? 'text-forest-600 bg-forest-50'
                : 'text-coral-600 bg-coral-50'
            }`}
          >
            {trend.isPositive ? (
              <svg
                className="w-3 h-3"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 10l7-7m0 0l7 7m-7-7v18"
                />
              </svg>
            ) : (
              <svg
                className="w-3 h-3"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 14l-7 7m0 0l-7-7m7 7V3"
                />
              </svg>
            )}
            {Math.abs(trend.value)}%
          </span>
        )}
      </div>
      {description && (
        <p className={`mt-3 text-sm ${isPlaceholder ? 'text-sage-300' : 'text-sage-400'}`}>
          {isPlaceholder ? `${description} (coming soon)` : description}
        </p>
      )}
    </div>
  );
}
