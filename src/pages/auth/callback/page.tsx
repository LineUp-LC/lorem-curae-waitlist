import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../../lib/supabase';

export default function AuthCallbackPage() {
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'error' | 'other-tab'>('loading');

  useEffect(() => {
    // sessionStorage is the reliable source — set by AdminLayout before the
    // magic link request so it survives even if Supabase strips query params.
    // Fall back to ?next= for other callers.
    const stored = sessionStorage.getItem('auth_next');
    sessionStorage.removeItem('auth_next');
    const params = new URLSearchParams(window.location.search);
    const nextParam = stored || params.get('next');
    const safeNext =
      nextParam && nextParam.startsWith('/') && !nextParam.startsWith('//')
        ? nextParam
        : null;

    // Admin sign-in only: if an admin tab is already open, it answers on this
    // channel and this tab stays put with a close-this-tab note instead of
    // opening a second dashboard. No answer within 1500 ms, or no
    // BroadcastChannel, means navigate exactly as before.
    let adminHandoffStarted = false;
    let channel: BroadcastChannel | null = null;
    let replyTimer: ReturnType<typeof setTimeout> | null = null;

    const closeChannel = () => {
      if (replyTimer) clearTimeout(replyTimer);
      replyTimer = null;
      if (channel) channel.close();
      channel = null;
    };

    const goNext = () => {
      if (safeNext !== '/admin') {
        navigate(safeNext ?? '/member');
        return;
      }
      if (adminHandoffStarted) return;
      adminHandoffStarted = true;

      if (typeof BroadcastChannel === 'undefined') {
        navigate('/admin');
        return;
      }

      channel = new BroadcastChannel('curae-admin-auth');
      channel.onmessage = (e: MessageEvent) => {
        const data: unknown = e.data;
        if (
          data !== null &&
          typeof data === 'object' &&
          (data as { type?: unknown }).type === 'admin-tab-here'
        ) {
          closeChannel();
          setStatus('other-tab');
        }
      };
      replyTimer = setTimeout(() => {
        closeChannel();
        navigate('/admin');
      }, 1500);
      channel.postMessage({ type: 'admin-signed-in' });
    };

    // getSession() may return null while Supabase is still exchanging the
    // hash-fragment token. Listen for SIGNED_IN instead, which fires once the
    // exchange completes and the session is established.
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (event === 'SIGNED_IN' && session) {
          subscription.unsubscribe();
          goNext();
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
        goNext();
      }
    });

    const timeout = setTimeout(() => {
      subscription.unsubscribe();
      // Once the admin handoff has started, this tab either navigates or shows
      // the signed-in note; the error screen must not replace either.
      if (!adminHandoffStarted) setStatus('error');
    }, 10_000);

    return () => {
      subscription.unsubscribe();
      clearTimeout(timeout);
      closeChannel();
    };
  }, [navigate]);

  if (status === 'other-tab') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-cream-50">
        <div className="text-center px-4">
          <p className="text-sage-800 text-xl font-medium mb-2">You're signed in.</p>
          <p className="text-sage-600 font-light">
            Your dashboard is open in your other tab. You can close this one.
          </p>
        </div>
      </div>
    );
  }

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
