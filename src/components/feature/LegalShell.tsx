import { Link } from 'react-router-dom';

/**
 * Minimal chrome for the standalone legal / info pages (privacy, terms,
 * delete-account, contact). Intentionally NOT the site Navbar/Footer: those
 * link into the abandoned web app (Marketplace, Community, etc.). This shell
 * shows only the Curae wordmark and a footer that cross-links the three legal
 * pages, so a reader (or an app-store reviewer) cannot tap through to an
 * unshipped surface.
 */
export default function LegalShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-cream-50 flex flex-col">
      <header className="py-6 px-6 lg:px-12">
        <Link to="/" className="inline-flex items-center" aria-label="Curae home">
          <span className="inline-flex items-center bg-[#0f0f0f] rounded-md px-3 py-1.5">
            <img src="/curae-logo.png" alt="Curae" className="h-8 w-auto" />
          </span>
        </Link>
      </header>

      <div className="flex-1">{children}</div>

      <footer className="border-t border-gray-200 py-8 px-6 lg:px-12">
        <nav className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-sm text-gray-500">
          <Link to="/privacy" className="hover:text-forest-900 transition-colors">
            Privacy Policy
          </Link>
          <span className="text-gray-300" aria-hidden="true">
            &middot;
          </span>
          <Link to="/terms" className="hover:text-forest-900 transition-colors">
            Terms of Service
          </Link>
          <span className="text-gray-300" aria-hidden="true">
            &middot;
          </span>
          <Link to="/delete-account" className="hover:text-forest-900 transition-colors">
            Delete Account
          </Link>
        </nav>
      </footer>
    </div>
  );
}
