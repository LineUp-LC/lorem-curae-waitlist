import { BulkDeleteFallbackPanel } from './BulkDeleteFallbackPanel';

export default function AdminToolsPage() {
  return (
    <div className="space-y-8">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-semibold text-sage-900">Admin Tools</h1>
        <p className="mt-1 text-sage-500">
          High-impact administrative actions
        </p>
      </div>

      {/* Warning banner */}
      <div className="bg-cream-50 border border-cream-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <svg className="w-5 h-5 text-cream-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <div>
            <p className="text-sm font-medium text-cream-800">
              Caution: These tools perform bulk operations
            </p>
            <p className="text-sm text-cream-700 mt-1">
              All actions on this page are logged and may be irreversible. Please use with care.
            </p>
          </div>
        </div>
      </div>

      {/* Tools grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Bulk Delete Fallback Users */}
        <BulkDeleteFallbackPanel />

        {/* Placeholder for future tools */}
        <div className="bg-white rounded-xl border border-dashed border-sage-200 p-6 flex flex-col items-center justify-center text-center min-h-[300px]">
          <div className="w-12 h-12 rounded-full bg-sage-100 flex items-center justify-center mb-4">
            <svg className="w-6 h-6 text-sage-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
          </div>
          <h3 className="text-sm font-medium text-sage-600">More Tools Coming Soon</h3>
          <p className="text-xs text-sage-400 mt-1 max-w-[200px]">
            Additional admin tools will be added here as needed
          </p>
        </div>
      </div>
    </div>
  );
}
