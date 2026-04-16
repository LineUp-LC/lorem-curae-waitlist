import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type PageState = 'loading' | 'ready' | 'not-found';

interface MemberData {
  email: string;
  spotNumber: number;
  slotsRemaining: number;
  textOptIn: boolean;
  textOptInDeclined: boolean;
  textOptInOfferSentAt: string | null;
  textOptInExpiresAt: string | null;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function hoursRemaining(expiresAt: string): number {
  const ms = new Date(expiresAt).getTime() - Date.now();
  return Math.max(0, Math.floor(ms / 3600000));
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function MemberPage() {
  const navigate = useNavigate();
  const [state, setState] = useState<PageState>('loading');
  const [data, setData] = useState<MemberData | null>(null);
  const [phone, setPhone] = useState('');
  const [optInStatus, setOptInStatus] = useState<'idle' | 'submitting' | 'accepted' | 'declined' | 'error'>('idle');
  const [optInError, setOptInError] = useState('');

  useEffect(() => {
    let cancelled = false;

    async function load() {
      // Auth guard — redirect unauthenticated users to the magic link page.
      const { data: { session } } = await supabase.auth.getSession();
      if (cancelled) return;
      if (!session?.user?.email) {
        navigate('/waitlist');
        return;
      }

      const email = session.user.email.trim().toLowerCase();

      // Fetch the user's waitlist row and founding-slots view in parallel.
      const [
        { data: row, error: rowErr },
        { data: slotRow },
      ] = await Promise.all([
        supabase
          .from('waitlist')
          .select('id, created_at, text_opt_in, text_opt_in_declined, text_opt_in_offer_sent_at, text_opt_in_expires_at')
          .eq('email', email)
          .maybeSingle(),
        supabase.from('founding_member_slots').select('slots_remaining').single(),
      ]);

      if (cancelled) return;

      if (rowErr || !row) {
        setState('not-found');
        return;
      }

      // Spot number: count rows created before this user, then add 1.
      // Uses created_at ascending order — same column the waitlist table is
      // naturally ordered by on creation.
      const { count: priorCount, error: countErr } = await supabase
        .from('waitlist')
        .select('id', { count: 'exact', head: true })
        .lt('created_at', row.created_at as string);

      if (cancelled) return;

      if (countErr) {
        setState('not-found');
        return;
      }

      setData({
        email,
        spotNumber: (priorCount ?? 0) + 1,
        slotsRemaining: (slotRow as { slots_remaining: number } | null)?.slots_remaining ?? 0,
        textOptIn: (row as { text_opt_in?: boolean }).text_opt_in ?? false,
        textOptInDeclined: (row as { text_opt_in_declined?: boolean }).text_opt_in_declined ?? false,
        textOptInOfferSentAt: (row as { text_opt_in_offer_sent_at?: string | null }).text_opt_in_offer_sent_at ?? null,
        textOptInExpiresAt: (row as { text_opt_in_expires_at?: string | null }).text_opt_in_expires_at ?? null,
      });
      setState('ready');
    }

    load().catch(() => {
      if (!cancelled) setState('not-found');
    });

    return () => {
      cancelled = true;
    };
  }, [navigate]);

  // ---------------------------------------------------------------------------
  // Loading
  // ---------------------------------------------------------------------------

  if (state === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-cream-50">
        <div className="w-8 h-8 border-2 border-sage-300 border-t-sage-600 rounded-full animate-spin" />
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // Not found
  // ---------------------------------------------------------------------------

  if (state === 'not-found') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-cream-50 px-6 text-center">
        <span className="font-serif text-2xl font-semibold text-sage-900 tracking-tight mb-12">
          Curae
        </span>
        <p className="text-sage-600 text-base">We couldn't find your account.</p>
        <a
          href="/waitlist"
          className="mt-6 text-sm text-coral-600 hover:text-coral-700 underline underline-offset-2 transition-colors"
        >
          Back to waitlist
        </a>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // Ready
  // ---------------------------------------------------------------------------

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-cream-50 px-6 py-12">
      {/* Wordmark — links back to the main waitlist page */}
      <a
        href="/waitlist"
        className="font-serif text-2xl font-semibold text-sage-900 tracking-tight mb-14"
      >
        Curae
      </a>

      <div className="w-full max-w-xs">
        {/* Text opt-in — confirmed */}
        {(data?.textOptIn || optInStatus === 'accepted') && (
          <div className="border-b border-sage-100 pb-8 mb-8">
            <p className="text-sage-500 text-xs font-medium uppercase tracking-widest mb-2">
              Personal texts
            </p>
            <p className="text-sage-700 text-sm">You're on the personal text list.</p>
          </div>
        )}

        {/* Text opt-in — banner (offer active, not yet accepted or declined) */}
        {!data?.textOptIn &&
          !data?.textOptInDeclined &&
          optInStatus !== 'accepted' &&
          optInStatus !== 'declined' &&
          data?.textOptInOfferSentAt &&
          data?.textOptInExpiresAt &&
          new Date(data.textOptInExpiresAt) > new Date() && (
          <div className="border-b border-sage-100 pb-8 mb-8">
            <p className="text-sage-500 text-xs font-medium uppercase tracking-widest mb-3">
              Personal texts from Ethan
            </p>
            <p className="text-sage-800 text-sm mb-4">
              You're one of our first 100 founding members. Drop your number and I'll text you directly.
            </p>
            <div className="space-y-2">
              <input
                type="tel"
                placeholder="Your phone number"
                value={phone}
                onChange={(e) => {
                  setPhone(e.target.value);
                  if (optInStatus === 'error') setOptInStatus('idle');
                }}
                disabled={optInStatus === 'submitting'}
                className="w-full px-4 py-3 border border-sage-200 rounded-xl text-sage-800 placeholder-sage-400 focus:outline-none focus:ring-2 focus:ring-sage-400/40 focus:border-sage-400 transition-colors disabled:opacity-60 text-sm"
              />
              {optInStatus === 'error' && (
                <p className="text-coral-600 text-xs">{optInError}</p>
              )}
              <button
                disabled={optInStatus === 'submitting' || !phone.trim()}
                onClick={async () => {
                  setOptInStatus('submitting');
                  setOptInError('');
                  try {
                    const r = await fetch('/api/text-opt-in', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ email: data?.email, phone_number: phone, action: 'accept' }),
                    });
                    if (!r.ok) {
                      const body = await r.json().catch(() => ({})) as { error?: string };
                      setOptInStatus('error');
                      setOptInError(
                        body.error === 'offer-expired'
                          ? 'This offer has expired.'
                          : body.error === 'no-slots-remaining'
                          ? 'All spots have been claimed.'
                          : 'Something went wrong. Please try again.',
                      );
                    } else {
                      setOptInStatus('accepted');
                    }
                  } catch {
                    setOptInStatus('error');
                    setOptInError('Something went wrong. Please try again.');
                  }
                }}
                className="w-full py-3 bg-sage-600 text-white rounded-xl font-medium text-sm hover:bg-sage-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {optInStatus === 'submitting' ? 'Saving...' : "I'm in"}
              </button>
              <button
                disabled={optInStatus === 'submitting'}
                onClick={async () => {
                  setOptInStatus('submitting');
                  try {
                    await fetch('/api/text-opt-in', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ email: data?.email, action: 'decline' }),
                    });
                  } catch {
                    // Ignore errors on decline — still hide the banner
                  }
                  setOptInStatus('declined');
                }}
                className="w-full py-2 text-sage-400 text-xs hover:text-sage-600 transition-colors disabled:opacity-60"
              >
                No thanks
              </button>
            </div>
            <p className="text-sage-400 text-xs mt-3">
              Offer expires in {hoursRemaining(data.textOptInExpiresAt)}h
            </p>
          </div>
        )}

        {/* Email */}
        <div className="border-b border-sage-100 pb-8 mb-8">
          <p className="text-sage-500 text-xs font-medium uppercase tracking-widest mb-2">
            Signed in as
          </p>
          <p className="text-sage-900 text-sm break-all">{data?.email}</p>
        </div>

        {/* Spot number */}
        <div className="border-b border-sage-100 pb-8 mb-8">
          <p className="text-sage-500 text-xs font-medium uppercase tracking-widest mb-3">
            Your spot
          </p>
          <p className="font-serif text-5xl text-sage-900 leading-none">
            #{data?.spotNumber}
          </p>
        </div>

        {/* Founding spots remaining */}
        <div>
          <p className="text-sage-500 text-xs font-medium uppercase tracking-widest mb-3">
            Founding spots remaining
          </p>
          <p className="font-serif text-5xl text-coral-600 leading-none">
            {data?.slotsRemaining}
          </p>
        </div>
      </div>
    </div>
  );
}
