import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../../lib/supabase';

export default function AuthCallbackPage() {
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'error'>('loading');

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();

        if (!session?.user?.email) {
          navigate('/waitlist');
          return;
        }

        console.log('[AuthCallback] Callback fired - user authenticated via magic link');

        const params = new URLSearchParams(window.location.search);
        const nextParam = params.get('next');
        const safeNext = nextParam && nextParam.startsWith('/') && !nextParam.startsWith('//') ? nextParam : null;

        if (safeNext) {
          navigate(safeNext);
        } else {
          navigate('/member');
        }
      } catch (err) {
        console.error('Auth callback error:', err);
        setStatus('error');
      }
    };

    handleAuthCallback();
  }, [navigate]);

  if (status === 'error') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-cream-50">
        <div className="text-center">
          <p className="text-sage-700 mb-4">Something went wrong. Please try again.</p>
          <a href="/waitlist" className="text-coral-600 underline">
            Return to waitlist
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-cream-50">
      <div className="text-center">
        <div className="w-8 h-8 border-2 border-sage-300 border-t-sage-600 rounded-full animate-spin mx-auto mb-4" />
        <p className="text-sage-600 font-light">Signing you in...</p>
      </div>
    </div>
  );
}
