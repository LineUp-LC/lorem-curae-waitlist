import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../../lib/supabase';

export default function AuthCallbackPage() {
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'error'>('loading');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const nextParam = params.get('next');
    const safeNext =
      nextParam && nextParam.startsWith('/') && !nextParam.startsWith('//')
        ? nextParam
        : null;

    // getSession() may return null while Supabase is still exchanging the
    // hash-fragment token. Listen for SIGNED_IN instead, which fires once the
    // exchange completes and the session is established.
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (event === 'SIGNED_IN' && session) {
          subscription.unsubscribe();
          navigate(safeNext ?? '/member');
        } else if (event === 'SIGNED_OUT') {
          subscription.unsubscribe();
          navigate('/waitlist');
        }
      }
    );

    // Fallback: if the session already exists (page refreshed), resolve immediately
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        subscription.unsubscribe();
        navigate(safeNext ?? '/member');
      }
    });

    const timeout = setTimeout(() => {
      subscription.unsubscribe();
      setStatus('error');
    }, 10_000);

    return () => {
      subscription.unsubscribe();
      clearTimeout(timeout);
    };
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
