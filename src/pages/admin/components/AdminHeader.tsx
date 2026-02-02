import { Link, useLocation } from 'react-router-dom';
import { useDarkMode } from './AdminLayout';

// ============================================================================
// Breadcrumb Configuration
// ============================================================================

const routeLabels: Record<string, string> = {
  '/admin': 'Dashboard',
  '/admin/waitlist': 'Waitlist Analytics',
  '/admin/waves': 'Waves',
  '/admin/wave-analytics': 'Wave Analytics',
  '/admin/emails': 'Email Analytics',
  '/admin/email-events': 'Email Events',
  '/admin/email-templates': 'Email Templates',
  '/admin/activity': 'Activity Log',
  '/admin/search': 'Search Users',
  '/admin/user': 'User Details',
  '/admin/user-profile': 'User Profile',
  '/admin/user-simulate': 'User Simulation',
  '/admin/tools': 'Tools',
  '/admin/health': 'Health Checks',
  '/admin/flags': 'Feature Flags',
  '/admin/logs': 'Live Logs',
  '/admin/activity-stream': 'Activity Stream',
  '/admin/incidents': 'Incidents',
  '/admin/metrics': 'Metrics',
  '/admin/notifications': 'Notifications',
};

function getBreadcrumbLabel(pathname: string): string {
  // Exact match first
  if (routeLabels[pathname]) return routeLabels[pathname];

  // Try matching base route for dynamic routes
  const basePath = pathname.split('/').slice(0, 3).join('/');
  if (routeLabels[basePath]) return routeLabels[basePath];

  // Default fallback
  const lastSegment = pathname.split('/').pop() || '';
  return lastSegment.charAt(0).toUpperCase() + lastSegment.slice(1).replace(/-/g, ' ');
}

// ============================================================================
// Component
// ============================================================================

interface AdminHeaderProps {
  onMenuClick: () => void;
}

export function AdminHeader({ onMenuClick }: AdminHeaderProps) {
  const location = useLocation();
  const { isDark, toggle: toggleDarkMode } = useDarkMode();
  const currentLabel = getBreadcrumbLabel(location.pathname);
  const isHome = location.pathname === '/admin';

  return (
    <header className="sticky top-0 z-30 bg-white/95 dark:bg-sage-800/95 backdrop-blur-sm border-b border-sage-100 dark:border-sage-700 transition-colors">
      <div className="flex items-center justify-between h-16 px-4 sm:px-6 lg:px-8">
        {/* Left side */}
        <div className="flex items-center gap-4">
          {/* Mobile menu button */}
          <button
            onClick={onMenuClick}
            className="lg:hidden p-2 rounded-lg hover:bg-sage-100 text-sage-500 hover:text-sage-700 transition-colors"
            aria-label="Open menu"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          {/* Breadcrumb */}
          <nav className="hidden sm:flex items-center gap-2 text-sm" aria-label="Breadcrumb">
            <Link
              to="/admin"
              className="text-sage-500 hover:text-sage-700 transition-colors"
            >
              Admin
            </Link>
            {!isHome && (
              <>
                <svg className="w-4 h-4 text-sage-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
                <span className="text-sage-800 font-medium">{currentLabel}</span>
              </>
            )}
          </nav>

          {/* Mobile title */}
          <span className="sm:hidden text-sage-800 font-medium">{currentLabel}</span>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-2">
          {/* Dark mode toggle */}
          <button
            onClick={toggleDarkMode}
            className="p-2 rounded-lg hover:bg-sage-100 dark:hover:bg-sage-700 text-sage-500 dark:text-sage-400 hover:text-sage-700 dark:hover:text-sage-200 transition-colors"
            title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {isDark ? (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
              </svg>
            )}
          </button>

          {/* Refresh button */}
          <button
            onClick={() => window.location.reload()}
            className="p-2 rounded-lg hover:bg-sage-100 dark:hover:bg-sage-700 text-sage-500 dark:text-sage-400 hover:text-sage-700 dark:hover:text-sage-200 transition-colors"
            title="Refresh page"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>

          {/* Notifications */}
          <Link
            to="/admin/notifications"
            className="p-2 rounded-lg hover:bg-sage-100 text-sage-500 hover:text-sage-700 transition-colors relative"
            title="Notifications"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            {/* Notification dot - would be dynamic in production */}
            <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-coral-500 rounded-full border-2 border-white" />
          </Link>

          {/* Divider */}
          <div className="hidden sm:block w-px h-8 bg-sage-200 mx-1" />

          {/* User menu */}
          <div className="flex items-center gap-3">
            <div className="hidden sm:block text-right">
              <p className="text-sm font-medium text-sage-800">Admin User</p>
              <p className="text-xs text-sage-500">admin@loremcurae.com</p>
            </div>
            <button
              className="w-9 h-9 rounded-full bg-forest-100 flex items-center justify-center hover:bg-forest-200 transition-colors"
              aria-label="User menu"
            >
              <svg className="w-5 h-5 text-forest-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
