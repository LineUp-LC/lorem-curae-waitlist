import { Link } from 'react-router-dom';
import LegalShell from '../components/feature/LegalShell';

export default function NotFound() {
  return (
    <LegalShell>
      <main className="pt-8 pb-16">
        <div className="max-w-xl mx-auto px-6 lg:px-12 text-center">
          <h1 className="text-3xl lg:text-4xl font-light text-forest-900 mb-4">Page not found</h1>
          <p className="text-gray-600 text-lg mb-8">
            This page isn&#39;t part of Curae yet.
          </p>
          <Link
            to="/"
            className="inline-flex items-center bg-forest-900 text-cream-50 py-3 px-6 rounded-lg hover:bg-forest-800 transition-colors"
          >
            Back to Curae
          </Link>
        </div>
      </main>
    </LegalShell>
  );
}
