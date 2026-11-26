import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import LegalShell from '../../components/feature/LegalShell';

// ============================================================================
// Unsubscribe confirmation (tracked in #26, decision 2a)
//
// The link in every email opens the unsubscribe edge function, whose GET only
// redirects here and changes nothing. Mail scanners and link previewers open
// links on their own; nothing happens until a person presses the button, which
// POSTs the token to the edge function. That POST checks the token and marks the
// person unsubscribed and Removed.
//
// THE CODE LEAVES THE ADDRESS BAR AT ONCE (waitlist issue 33 item 1). Links
// already sent arrive as ?token=..., which is the only way the code reaches this
// page. It is read once when the page opens, then removed from the address with
// history.replaceState, so it does not linger in the address bar, history,
// screenshots or a copied link. The button sends it in the POST body only, never
// in the request address. Opening the page still changes nothing.
//
// Why a page on this site and not on the function: the function's default
// supabase.co domain serves HTML as plain text, so a button there would show
// as raw markup.
// ============================================================================

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type Phase = 'invalid' | 'ready' | 'submitting' | 'done' | 'already' | 'error';

function unsubscribeEndpoint(): string | null {
  const base = import.meta.env.VITE_SUPABASE_URL as string | undefined;
  if (!base) return null;
  return `${base.replace(/\/$/, '')}/functions/v1/unsubscribe`;
}

const UnsubscribePage = () => {
  const [params] = useSearchParams();
  // Read ONCE, when the page opens; the address is cleared right after.
  const [token] = useState(() => (params.get('token') ?? '').trim());
  const tokenLooksValid = UUID_RE.test(token);

  const [phase, setPhase] = useState<Phase>(tokenLooksValid ? 'ready' : 'invalid');
  const [errorText, setErrorText] = useState<string | null>(null);

  useEffect(() => {
    document.title = 'Unsubscribe | Curae';
  }, []);

  // Remove the code from the address bar. Other query parts and the router's
  // history state are kept.
  useEffect(() => {
    const url = new URL(window.location.href);
    if (!url.searchParams.has('token')) return;
    url.searchParams.delete('token');
    window.history.replaceState(window.history.state, '', `${url.pathname}${url.search}${url.hash}`);
  }, []);

  const handleConfirm = async () => {
    const endpoint = unsubscribeEndpoint();
    if (!endpoint) {
      setPhase('error');
      setErrorText('Something went wrong. Please try again later.');
      return;
    }
    setPhase('submitting');
    setErrorText(null);
    try {
      // The code goes in the body only, never in the request address.
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      });
      const data = (await res.json().catch(() => ({}))) as { result?: string };
      if (res.ok && data.result === 'unsubscribed') {
        setPhase('done');
      } else if (res.ok && data.result === 'already_unsubscribed') {
        setPhase('already');
      } else if (res.status === 404 || res.status === 400) {
        setPhase('invalid');
      } else {
        setPhase('error');
        setErrorText('Something went wrong. Please try again later.');
      }
    } catch {
      setPhase('error');
      setErrorText('We could not reach the server. Check your connection and try again.');
    }
  };

  return (
    <LegalShell>
      <main className="pt-8 pb-16">
        <div className="max-w-xl mx-auto px-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 lg:p-12 text-center">
            {phase === 'invalid' && (
              <>
                <h1 className="text-3xl font-light text-forest-900 mb-4">Link not valid</h1>
                <p className="text-gray-700 leading-relaxed">
                  This unsubscribe link is invalid. If you keep getting emails you did not ask for,
                  write to{' '}
                  <a href="mailto:ethanjones@loremcurae.com" className="text-forest-700 hover:underline">
                    ethanjones@loremcurae.com
                  </a>.
                </p>
              </>
            )}

            {(phase === 'ready' || phase === 'submitting' || phase === 'error') && (
              <>
                <h1 className="text-3xl font-light text-forest-900 mb-4">Unsubscribe from Curae?</h1>
                <p className="text-gray-700 leading-relaxed mb-8">
                  You will stop getting emails and texts from us, and you will be taken off the
                  waitlist.
                </p>
                {errorText && (
                  <p className="text-sm text-coral-700 mb-4" role="alert">{errorText}</p>
                )}
                <button
                  type="button"
                  onClick={handleConfirm}
                  disabled={phase === 'submitting'}
                  className="w-full bg-forest-900 text-cream-50 py-3 px-6 rounded-lg hover:bg-forest-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap cursor-pointer"
                >
                  {phase === 'submitting' ? 'Unsubscribing...' : 'Yes, unsubscribe me'}
                </button>
              </>
            )}

            {phase === 'done' && (
              <>
                <h1 className="text-3xl font-light text-forest-900 mb-4">You are unsubscribed</h1>
                <p className="text-gray-700 leading-relaxed">You won&#8217;t hear from us again.</p>
              </>
            )}

            {phase === 'already' && (
              <>
                <h1 className="text-3xl font-light text-forest-900 mb-4">Already unsubscribed</h1>
                <p className="text-gray-700 leading-relaxed">You&#8217;re already unsubscribed.</p>
              </>
            )}
          </div>
        </div>
      </main>
    </LegalShell>
  );
};

export default UnsubscribePage;
