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
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function MemberPage() {
  const navigate = useNavigate();
  const [state, setState] = useState<PageState>('loading');
  const [data, setData] = useState<MemberData | null>(null);

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
        supabase.from('waitlist').select('id, created_at').eq('email', email).maybeSingle(),
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
