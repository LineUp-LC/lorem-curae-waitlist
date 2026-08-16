import { lazy } from 'react';
import { RouteObject } from 'react-router-dom';

// Lazy load components
//
// This app is the Curae WAITLIST site. The abandoned consumer web app
// (marketplace, community, cart, storefront, skin-survey, ingredients, etc.)
// has been removed from the route table so none of it is reachable. Only the
// waitlist product surfaces are routed: the landing, the legal pages, the
// magic-link callback, the founding-member page, and the admin ops console.
// Any other path falls through to the branded 404 (catch-all below).

// Admin pages (waitlist operations console)
const AdminLayout = lazy(() => import('../pages/admin/components/AdminLayout').then(m => ({ default: m.AdminLayout })));
const AdminDashboardPage = lazy(() => import('../pages/admin/page'));
const WaitlistAnalyticsPage = lazy(() => import('../pages/admin/waitlist-analytics/page'));
const WaveAnalyticsPage = lazy(() => import('../pages/admin/wave-analytics/page'));
const EmailAnalyticsPage = lazy(() => import('../pages/admin/email-analytics/page'));
const ActivityLogPage = lazy(() => import('../pages/admin/activity-log/page'));
const AdminSearchPage = lazy(() => import('../pages/admin/search/page'));
const UserDetailPage = lazy(() => import('../pages/admin/user/page'));
const UserProfilePage = lazy(() => import('../pages/admin/user-profile/page'));
const UserSimulatePage = lazy(() => import('../pages/admin/user-simulate/page'));
const AdminToolsPage = lazy(() => import('../pages/admin/tools/page'));
const HealthChecksPage = lazy(() => import('../pages/admin/health-checks/page'));
const LiveLogsPage = lazy(() => import('../pages/admin/live-logs/page'));
const LiveUserActivityPage = lazy(() => import('../pages/admin/live-user-activity/page'));
const FeatureFlagsPage = lazy(() => import('../pages/admin/feature-flags/page'));
const WaveManagementPage = lazy(() => import('../pages/admin/waves-management/page'));
const AccessManagementPage = lazy(() => import('../pages/admin/access/page'));
const EmailEventsPage = lazy(() => import('../pages/admin/email-events/page'));
const EmailTemplatesPage = lazy(() => import('../pages/admin/email-templates/page'));
const IncidentsPage = lazy(() => import('../pages/admin/incidents/page'));
const MetricsPage = lazy(() => import('../pages/admin/metrics/page'));
const NotificationsPage = lazy(() => import('../pages/admin/notifications/page'));
const TextOptInsPage = lazy(() => import('../pages/admin/text-opt-ins/page'));

// Waitlist product surfaces
const Waitlist = lazy(() => import('../pages/preview-of-waitlist-early-access-2025/page'));
const AuthCallbackPage = lazy(() => import('../pages/auth/callback/page'));
const MemberPage = lazy(() => import('../pages/member/page'));
const PrivacyPage = lazy(() => import('../pages/privacy/page'));
const TermsPage = lazy(() => import('../pages/terms/page'));
const DeleteAccountPage = lazy(() => import('../pages/delete-account/page'));
const ContactPage = lazy(() => import('../pages/contact/page'));
const NotFoundPage = lazy(() => import('../pages/NotFound'));

const routes: RouteObject[] = [
  {
    path: '/',
    element: <Waitlist />,
  },
  {
    path: '/waitlist',
    element: <Waitlist />,
  },
  {
    path: '/auth/callback',
    element: <AuthCallbackPage />,
  },
  {
    path: '/member',
    element: <MemberPage />,
  },
  {
    path: '/privacy',
    element: <PrivacyPage />,
  },
  {
    path: '/terms',
    element: <TermsPage />,
  },
  {
    path: '/delete-account',
    element: <DeleteAccountPage />,
  },
  {
    path: '/contact',
    element: <ContactPage />,
  },
  // Admin routes (waitlist operations console)
  {
    path: '/admin',
    element: <AdminLayout />,
    children: [
      {
        index: true,
        element: <AdminDashboardPage />,
      },
      {
        path: 'waitlist',
        element: <WaitlistAnalyticsPage />,
      },
      {
        path: 'waves',
        element: <WaveManagementPage />,
      },
      {
        path: 'access',
        element: <AccessManagementPage />,
      },
      {
        path: 'wave-analytics',
        element: <WaveAnalyticsPage />,
      },
      {
        path: 'emails',
        element: <EmailAnalyticsPage />,
      },
      {
        path: 'activity',
        element: <ActivityLogPage />,
      },
      {
        path: 'search',
        element: <AdminSearchPage />,
      },
      {
        path: 'user/:email',
        element: <UserDetailPage />,
      },
      {
        path: 'user-profile/:email',
        element: <UserProfilePage />,
      },
      {
        path: 'user-simulate/:email',
        element: <UserSimulatePage />,
      },
      {
        path: 'tools',
        element: <AdminToolsPage />,
      },
      {
        path: 'health-checks',
        element: <HealthChecksPage />,
      },
      {
        path: 'logs',
        element: <LiveLogsPage />,
      },
      {
        path: 'activity-stream',
        element: <LiveUserActivityPage />,
      },
      {
        path: 'flags',
        element: <FeatureFlagsPage />,
      },
      {
        path: 'email-events',
        element: <EmailEventsPage />,
      },
      {
        path: 'email-templates',
        element: <EmailTemplatesPage />,
      },
      {
        path: 'incidents',
        element: <IncidentsPage />,
      },
      {
        path: 'metrics',
        element: <MetricsPage />,
      },
      {
        path: 'notifications',
        element: <NotificationsPage />,
      },
      {
        path: 'text-opt-ins',
        element: <TextOptInsPage />,
      },
    ],
  },
  {
    path: '*',
    element: <NotFoundPage />,
  },
];

export default routes;
