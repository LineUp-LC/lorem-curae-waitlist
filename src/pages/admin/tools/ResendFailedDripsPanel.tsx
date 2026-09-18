import { useState } from 'react';
import { getAdminToken } from '@/lib/adminAuth';

// ----------------------------------------------------------------------------
// Bulk repair of failed drip sends.
//
// TWO STEPS, ALWAYS. The preview is a real server call with dryRun, so the list
// shown is the list that will be sent, resolved by the same predicate rather
// than guessed by the UI. Sending real email to real people should never be
// what happens on a first click.
//
// Resumable: a successful send flips its row out of `failed`, which is the same
// predicate that selects candidates. If the function times out part-way, run it
// again and it picks up what is left.
// ----------------------------------------------------------------------------

const CONFIRMATION_PHRASE = 'SEND THEM';

interface RowResult {
  email: string;
  drip_event: string;
  status: string;
  reason?: string;
}

interface Preview {
  would_send: number;
  candidates: Array<{ email: string; drip_event: string }>;
  results: RowResult[];
}

interface SendReport {
  attempted: number;
  sent: number;
  failed: number;
  skipped: number;
  results: RowResult[];
}

export function ResendFailedDripsPanel() {
  const [preview, setPreview] = useState<Preview | null>(null);
  const [report, setReport] = useState<SendReport | null>(null);
  const [confirmPhrase, setConfirmPhrase] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const call = async (dryRun: boolean) => {
    const adminToken = await getAdminToken();
    const response = await fetch('/api/admin?action=resendAllFailedDrips', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${adminToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ dryRun, limit: 50 }),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || `Request failed (${response.status})`);
    return data;
  };

  const handlePreview = async () => {
    setLoading(true);
    setError(null);
    setReport(null);
    try {
      setPreview(await call(true));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Preview failed');
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await call(false);
      setReport(data);
      setPreview(null);
      setConfirmPhrase('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Send failed');
    } finally {
      setLoading(false);
    }
  };

  const canSend = confirmPhrase === CONFIRMATION_PHRASE && !loading;

  return (
    <div className="bg-white rounded-xl border border-sage-100 p-6">
      <h3 className="text-base font-semibold text-sage-900">Resend failed drip emails</h3>
      <p className="mt-1 text-sm text-sage-500">
        Sends every sequence email that failed and can still be sent. A failed row
        blocks the scheduler from ever retrying it, so nothing here fixes itself.
      </p>
      <p className="mt-2 text-xs text-sage-400">
        Retired events with no template, and anyone who has unsubscribed, are
        skipped and listed as skipped rather than silently dropped.
      </p>

      {error && (
        <div className="mt-4 rounded-lg border border-coral-200 bg-coral-50 px-4 py-3 text-sm text-coral-700">
          {error}
        </div>
      )}

      {/* Step 1 */}
      {!report && (
        <button
          type="button"
          onClick={handlePreview}
          disabled={loading}
          className="mt-4 px-4 py-2 text-sm font-medium text-sage-700 bg-sage-100 rounded-lg hover:bg-sage-200 transition-colors disabled:opacity-50"
        >
          {loading && !preview ? 'Checking...' : 'Preview what would send'}
        </button>
      )}

      {/* Step 2 */}
      {preview && (
        <div className="mt-5 border-t border-sage-100 pt-5">
          <p className="text-sm font-medium text-sage-800">
            {preview.would_send} email{preview.would_send === 1 ? '' : 's'} would be sent
            {preview.results.length > 0 && `, ${preview.results.length} skipped`}
          </p>

          {preview.candidates.length > 0 && (
            <ul className="mt-3 max-h-48 overflow-y-auto space-y-1">
              {preview.candidates.map((c, i) => (
                <li key={`${c.email}-${c.drip_event}-${i}`} className="text-xs text-sage-600 flex justify-between gap-3">
                  <span className="truncate">{c.email}</span>
                  <span className="font-mono text-sage-400 flex-shrink-0">{c.drip_event}</span>
                </li>
              ))}
            </ul>
          )}

          {preview.results.length > 0 && (
            <ul className="mt-3 space-y-1">
              {preview.results.map((r, i) => (
                <li key={`skip-${i}`} className="text-xs text-sage-400 flex justify-between gap-3">
                  <span className="truncate">{r.email}</span>
                  <span className="flex-shrink-0">skipped: {r.reason}</span>
                </li>
              ))}
            </ul>
          )}

          {preview.would_send > 0 && (
            <div className="mt-5">
              <label htmlFor="resend-confirm" className="block text-xs font-medium text-sage-600 mb-1">
                These are real emails to real people. Type{' '}
                <span className="font-mono text-sage-800">{CONFIRMATION_PHRASE}</span> to confirm.
              </label>
              <div className="flex gap-2">
                <input
                  id="resend-confirm"
                  type="text"
                  value={confirmPhrase}
                  onChange={(e) => setConfirmPhrase(e.target.value)}
                  className="flex-1 px-3 py-2 text-sm border border-sage-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-forest-500/30"
                  placeholder={CONFIRMATION_PHRASE}
                />
                <button
                  type="button"
                  onClick={handleSend}
                  disabled={!canSend}
                  className="px-4 py-2 text-sm font-medium text-white bg-forest-600 rounded-lg hover:bg-forest-700 transition-colors disabled:opacity-40"
                >
                  {loading ? 'Sending...' : `Send ${preview.would_send}`}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Result */}
      {report && (
        <div className="mt-5 border-t border-sage-100 pt-5">
          <p className="text-sm font-medium text-sage-800">
            {report.sent} sent, {report.failed} failed, {report.skipped} skipped
            {report.attempted !== report.sent + report.failed &&
              ` (of ${report.attempted} attempted)`}
          </p>
          <ul className="mt-3 max-h-64 overflow-y-auto space-y-1">
            {report.results.map((r, i) => (
              <li key={`res-${i}`} className="text-xs flex justify-between gap-3">
                <span className="truncate text-sage-600">{r.email}</span>
                <span
                  className={`flex-shrink-0 ${
                    r.status === 'sent'
                      ? 'text-forest-600'
                      : r.status === 'failed'
                      ? 'text-coral-700'
                      : 'text-sage-400'
                  }`}
                >
                  {r.status}
                  {r.reason ? `: ${r.reason}` : ''}
                </span>
              </li>
            ))}
          </ul>
          {report.failed > 0 && (
            <p className="mt-3 text-xs text-sage-500">
              Failed rows are still marked failed and can be tried again. Run the
              preview to see what is left.
            </p>
          )}
          <button
            type="button"
            onClick={handlePreview}
            disabled={loading}
            className="mt-4 px-4 py-2 text-sm font-medium text-sage-700 bg-sage-100 rounded-lg hover:bg-sage-200 transition-colors disabled:opacity-50"
          >
            Check again
          </button>
        </div>
      )}
    </div>
  );
}
