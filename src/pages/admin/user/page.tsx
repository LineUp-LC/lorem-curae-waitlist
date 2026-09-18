import { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getAdminToken } from '@/lib/adminAuth';
import {
  Badge,
  Button,
  Card,
  CardBody,
  CardHeader,
  ErrorBanner,
  LoadingState,
  Select,
  Toggle,
  WarningBanner,
} from '@/pages/admin/components/ui';
import { DeleteUserPanel } from './DeleteUserPanel';
import { AnonymizeUserPanel } from './AnonymizeUserPanel';
import { RegenerateTokenPanel } from './RegenerateTokenPanel';

// ============================================================================
// TYPES
// ============================================================================

interface WaitlistUser {
  id: string;
  email: string;
  created_at: string;
  updated_at: string | null;
  wave_number: number | null;
  status: string;
  segment: string | null;
  wants_beta: boolean;
  wants_tester_access: boolean;
  is_tester: boolean;
  is_creator: boolean;
  is_founding_member: boolean;
  is_founding_member_creator: boolean;
  creator_wave_number: number | null;
  price_locked: boolean;
  waitlist_position: number | null;
  unsubscribed_at: string | null;
  has_access: boolean;
  phone_number: string | null;
  text_opt_in: boolean;
}

interface DripRow {
  id: string;
  drip_event: string;
  status: 'sent' | 'failed';
  sent_at: string;
  error_text: string | null;
}

interface Neighbor {
  email: string;
  waitlist_position: number;
}

interface UserDetailResponse {
  user: WaitlistUser;
  drips: DripRow[] | null;
  drips_error: string | null;
  resendable_events: string[];
  neighbors: {
    prev: Neighbor | null;
    next: Neighbor | null;
    index: number | null;
    total: number | null;
  };
}

// ============================================================================
// DRIP VOCABULARY
// ============================================================================

// Sequence order, matching the day offsets the scheduler runs on. Rows are
// shown in this order rather than by timestamp, so a person's sequence always
// reads the same way regardless of which sends failed.
const DRIP_ORDER = [
  'welcome',
  'scan_walkthrough',
  'founding_rate_urgency',
  'scan_deep_dive',
  're_engagement',
];

const DRIP_LABELS: Record<string, string> = {
  welcome: 'Welcome',
  scan_walkthrough: 'Scan walkthrough',
  founding_rate_urgency: 'Founding rate urgency',
  scan_deep_dive: 'Scan deep dive',
  re_engagement: 'Re-engagement',
};

function dripLabel(event: string): string {
  return DRIP_LABELS[event] ?? event.replace(/_/g, ' ');
}

function dripRank(event: string): number {
  const i = DRIP_ORDER.indexOf(event);
  return i === -1 ? DRIP_ORDER.length : i;
}

// ============================================================================
// FORMATTING
// ============================================================================

function formatTimestamp(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

function formatStatus(status: string): string {
  return status.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

// ============================================================================
// SMALL PRESENTATIONAL PIECES
// ============================================================================

function Fact({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-2 border-t border-sage-100 first:border-t-0">
      <span className="text-sm text-sage-500">{label}</span>
      <span className="text-sm font-medium text-sage-800 text-right">{value}</span>
    </div>
  );
}

function userPath(email: string): string {
  return `/admin/user/${encodeURIComponent(email)}`;
}

// ============================================================================
// PAGE
// ============================================================================

export default function UserDetailPage() {
  const { email } = useParams<{ email: string }>();

  const [data, setData] = useState<UserDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);

  // Resend state, keyed by drip_event.
  const [resending, setResending] = useState<Record<string, boolean>>({});
  const [resendError, setResendError] = useState<Record<string, string>>({});
  const [resendNote, setResendNote] = useState<string | null>(null);

  // Edit form state. Null until the user loads.
  const [form, setForm] = useState<Partial<WaitlistUser> | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveNote, setSaveNote] = useState<string | null>(null);

  // Grant access state.
  const [granting, setGranting] = useState(false);
  const [grantError, setGrantError] = useState<string | null>(null);
  const [grantNote, setGrantNote] = useState<string | null>(null);

  const fetchUserData = useCallback(async () => {
    if (!email) {
      setError('No email provided');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setNotFound(false);

      const adminToken = await getAdminToken();
      const response = await fetch(
        `/api/admin/get-waitlist-user?email=${encodeURIComponent(email)}`,
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${adminToken}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        if (response.status === 404) {
          setNotFound(true);
          return;
        }
        if (response.status === 401) {
          throw new Error('Unauthorized. Check admin credentials.');
        }
        throw new Error(`Failed to fetch user (${response.status})`);
      }

      const result: UserDetailResponse = await response.json();
      setData(result);
      setForm({
        wave_number: result.user.wave_number,
        status: result.user.status,
        is_founding_member: result.user.is_founding_member,
        is_founding_member_creator: result.user.is_founding_member_creator,
        is_creator: result.user.is_creator,
        creator_wave_number: result.user.creator_wave_number,
        price_locked: result.user.price_locked,
        is_tester: result.user.is_tester,
      });
    } catch (err) {
      console.error('[UserDetail] Failed to fetch:', err);
      setError(err instanceof Error ? err.message : 'Failed to load user details');
    } finally {
      setLoading(false);
    }
  }, [email]);

  // Reset every per-action message when the route changes, so prev/next never
  // carries one person's result onto the next person's page.
  useEffect(() => {
    setResending({});
    setResendError({});
    setResendNote(null);
    setSaveError(null);
    setSaveNote(null);
    setGrantError(null);
    setGrantNote(null);
    fetchUserData();
  }, [fetchUserData]);

  // --------------------------------------------------------------------------
  // ACTIONS
  // --------------------------------------------------------------------------

  const handleResend = async (dripEvent: string) => {
    if (!data) return;
    setResending((s) => ({ ...s, [dripEvent]: true }));
    setResendError((s) => ({ ...s, [dripEvent]: '' }));
    setResendNote(null);

    try {
      const adminToken = await getAdminToken();
      const response = await fetch('/api/admin?action=resendDripEmail', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${adminToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: data.user.email, dripEvent }),
      });

      const result = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(result.error || `Resend failed (${response.status})`);
      }

      if (result.log_updated === false) {
        // The email went out but the log did not move. Say so plainly rather
        // than showing a row that still reads failed with no explanation.
        setResendNote(
          result.warning ||
            'The email was sent, but the delivery log could not be updated.'
        );
      } else {
        setResendNote(`${dripLabel(dripEvent)} sent.`);
      }

      await fetchUserData();
    } catch (err) {
      setResendError((s) => ({
        ...s,
        [dripEvent]: err instanceof Error ? err.message : 'Resend failed',
      }));
      // Refresh anyway: a failed attempt rewrites the row error text.
      await fetchUserData();
    } finally {
      setResending((s) => ({ ...s, [dripEvent]: false }));
    }
  };

  const changedFields = (): Partial<WaitlistUser> => {
    if (!data || !form) return {};
    const out: Record<string, unknown> = {};
    (Object.keys(form) as Array<keyof WaitlistUser>).forEach((k) => {
      if (form[k] !== data.user[k]) out[k] = form[k];
    });
    return out as Partial<WaitlistUser>;
  };

  const dirtyKeys = Object.keys(changedFields());

  const handleSave = async () => {
    if (!data || dirtyKeys.length === 0) return;
    setSaving(true);
    setSaveError(null);
    setSaveNote(null);

    try {
      const adminToken = await getAdminToken();
      const response = await fetch('/api/admin?action=updateUser', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${adminToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: data.user.email, ...changedFields() }),
      });

      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(result.error || `Save failed (${response.status})`);
      }

      setSaveNote(
        `Saved ${dirtyKeys.length} change${dirtyKeys.length === 1 ? '' : 's'}.`
      );
      await fetchUserData();
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const handleGrantAccess = async () => {
    if (!data) return;
    setGranting(true);
    setGrantError(null);
    setGrantNote(null);

    try {
      const adminToken = await getAdminToken();
      const response = await fetch('/api/admin?action=grant-access', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${adminToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userIds: [data.user.id] }),
      });

      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(result.error || `Grant failed (${response.status})`);
      }

      const outcome = Array.isArray(result.results) ? result.results[0] : null;
      if (!outcome || outcome.status === 'failed') {
        throw new Error(outcome?.reason || 'Grant failed');
      }
      if (outcome.status === 'skipped') {
        setGrantNote(`Skipped: ${outcome.reason}`);
      } else if (outcome.reason === 'email_failed') {
        setGrantNote('Access granted, but the follow-up email did not send.');
      } else {
        setGrantNote('Access granted and the follow-up email was sent.');
      }

      await fetchUserData();
    } catch (err) {
      setGrantError(err instanceof Error ? err.message : 'Grant failed');
    } finally {
      setGranting(false);
    }
  };

  // --------------------------------------------------------------------------
  // STATES
  // --------------------------------------------------------------------------

  if (loading && !data) {
    return <LoadingState message="Loading user..." />;
  }

  if (notFound) {
    return (
      <div className="bg-white rounded-xl border border-sage-100 px-6 py-12 text-center">
        <h1 className="text-xl font-semibold text-sage-800 mb-2">User not found</h1>
        <p className="text-sage-500 mb-6">
          No waitlist user with email:{' '}
          <span className="font-mono text-sm">{email}</span>
        </p>
        <Link
          to="/admin/search"
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-sage-700 bg-sage-100 rounded-lg hover:bg-sage-200 transition-colors"
        >
          Back to search
        </Link>
      </div>
    );
  }

  if (error) {
    return <ErrorBanner title="Could not load this user" message={error} onRetry={fetchUserData} />;
  }

  if (!data || !form) return null;

  const { user, drips, drips_error, resendable_events, neighbors } = data;

  // Order the sequence, and note which rows can actually be repaired.
  const rows = (drips ?? []).slice().sort((a, b) => {
    const r = dripRank(a.drip_event) - dripRank(b.drip_event);
    return r !== 0 ? r : a.sent_at.localeCompare(b.sent_at);
  });

  const failedRows = rows.filter((r) => r.status === 'failed');
  const repairable = failedRows.filter((r) => resendable_events.includes(r.drip_event));
  const retiredFailures = failedRows.filter((r) => !resendable_events.includes(r.drip_event));
  const deliveredCount = rows.filter((r) => r.status === 'sent').length;

  return (
    <div className="space-y-6">
      {/* ------------------------------------------------------------------ */}
      {/* HEADER                                                              */}
      {/* ------------------------------------------------------------------ */}
      <div className="flex items-start justify-between gap-6 flex-wrap">
        <div className="min-w-0">
          <Link
            to="/admin/search"
            className="text-xs font-medium text-sage-500 hover:text-sage-700"
          >
            All signups
          </Link>
          <h1 className="mt-1 text-2xl font-semibold text-sage-900 break-all">
            {user.email}
          </h1>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            {user.waitlist_position !== null && (
              <Badge variant="default">
                Position {user.waitlist_position}
                {neighbors.index !== null && neighbors.total !== null
                  ? ` (${neighbors.index} of ${neighbors.total})`
                  : ''}
              </Badge>
            )}
            <Badge variant="default">
              {user.wave_number !== null ? `Wave ${user.wave_number}` : 'No wave'}
            </Badge>
            <Badge variant={user.status === 'active' ? 'success' : 'warning'}>
              {formatStatus(user.status)}
            </Badge>
            {user.is_founding_member && <Badge variant="purple">Founding member</Badge>}
            {user.is_tester && <Badge variant="info">Tester</Badge>}
            {user.unsubscribed_at && <Badge variant="error">Unsubscribed</Badge>}
          </div>
        </div>

        {/* prev/next, ordered by waitlist_position */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {neighbors.prev ? (
            <Link to={userPath(neighbors.prev.email)}>
              <Button variant="secondary" size="sm">
                Previous
              </Button>
            </Link>
          ) : (
            <Button variant="secondary" size="sm" disabled>
              Previous
            </Button>
          )}
          {neighbors.next ? (
            <Link to={userPath(neighbors.next.email)}>
              <Button variant="secondary" size="sm">
                Next
              </Button>
            </Link>
          ) : (
            <Button variant="secondary" size="sm" disabled>
              Next
            </Button>
          )}
        </div>
      </div>

      {user.unsubscribed_at && (
        <WarningBanner
          title="This person has unsubscribed"
          message={`Unsubscribed ${formatDate(user.unsubscribed_at)}. No email will be sent to them, including a resend.`}
        />
      )}

      {/* ------------------------------------------------------------------ */}
      {/* DELIVERY LEDGER                                                     */}
      {/* ------------------------------------------------------------------ */}
      <Card>
        <CardHeader
          title="Email sequence"
          subtitle={
            drips === null
              ? undefined
              : `${deliveredCount} delivered, ${failedRows.length} failed`
          }
        />
        <CardBody padding="none">
          {/* A failed READ is not an empty log. */}
          {drips === null ? (
            <div className="px-6 py-8">
              <ErrorBanner
                title="Delivery log unavailable"
                message={
                  drips_error ||
                  'The delivery log could not be read, so we cannot say what this person has been sent.'
                }
                onRetry={fetchUserData}
              />
            </div>
          ) : rows.length === 0 ? (
            <div className="px-6 py-8 text-sm text-sage-500">
              No sequence email has been attempted for this person yet.
            </div>
          ) : (
            <>
              {repairable.length > 0 && (
                <div className="px-6 pt-5">
                  <WarningBanner
                    title={`${repairable.length} email${repairable.length === 1 ? '' : 's'} can be sent now`}
                    message="The scheduler treats a failed row as already handled, so these will never be retried on their own."
                  />
                </div>
              )}

              {resendNote && (
                <div className="px-6 pt-4">
                  <div className="rounded-lg border border-forest-200 bg-forest-50 px-4 py-3 text-sm text-forest-700">
                    {resendNote}
                  </div>
                </div>
              )}

              <ul className="divide-y divide-sage-100 mt-4">
                {rows.map((row) => {
                  const canResend =
                    row.status === 'failed' &&
                    resendable_events.includes(row.drip_event) &&
                    !user.unsubscribed_at;
                  const retired =
                    row.status === 'failed' && !resendable_events.includes(row.drip_event);

                  return (
                    <li key={row.id} className="px-6 py-4">
                      <div className="flex items-start justify-between gap-4 flex-wrap">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-semibold text-sage-800">
                              {dripLabel(row.drip_event)}
                            </span>
                            <Badge
                              variant={row.status === 'sent' ? 'success' : 'error'}
                              size="sm"
                            >
                              {row.status === 'sent' ? 'Delivered' : 'Failed'}
                            </Badge>
                            {retired && (
                              <Badge variant="default" size="sm">
                                Retired
                              </Badge>
                            )}
                          </div>
                          <div className="mt-1 font-mono text-xs text-sage-400">
                            {row.drip_event} · {formatTimestamp(row.sent_at)}
                          </div>
                          {row.error_text && (
                            <div className="mt-1 text-xs text-coral-700 break-all">
                              {row.error_text}
                            </div>
                          )}
                          {retired && (
                            <div className="mt-2 text-xs text-sage-500 max-w-xl">
                              This email was retired and its template no longer
                              exists, so it cannot be sent. Nothing here will
                              deliver it.
                            </div>
                          )}
                          {resendError[row.drip_event] && (
                            <div className="mt-2 text-xs font-medium text-coral-700">
                              {resendError[row.drip_event]}
                            </div>
                          )}
                        </div>

                        {canResend && (
                          <Button
                            variant="primary"
                            size="sm"
                            loading={Boolean(resending[row.drip_event])}
                            disabled={Boolean(resending[row.drip_event])}
                            onClick={() => handleResend(row.drip_event)}
                          >
                            Send it now
                          </Button>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>

              {retiredFailures.length > 0 && (
                <div className="px-6 py-4 bg-sage-50 border-t border-sage-100 text-xs text-sage-500">
                  {retiredFailures.length} failed{' '}
                  {retiredFailures.length === 1 ? 'email is' : 'emails are'} not
                  repairable, counted separately from the{' '}
                  {repairable.length} that {repairable.length === 1 ? 'is' : 'are'}.
                </div>
              )}

              <div className="px-6 py-3 bg-sage-50 border-t border-sage-100 text-xs text-sage-400">
                Delivery is recorded from drip_send_log. Opens and clicks are not tracked.
              </div>
            </>
          )}
        </CardBody>
      </Card>

      {/* ------------------------------------------------------------------ */}
      {/* EDIT CARD                                                           */}
      {/* ------------------------------------------------------------------ */}
      <Card>
        <CardHeader
          title="Record"
          subtitle="Admin decisions only. What this person told us is shown below, and is not editable here."
        />
        <CardBody>
          {saveError && (
            <div className="mb-4">
              <ErrorBanner title="Could not save" message={saveError} />
            </div>
          )}
          {saveNote && (
            <div className="mb-4 rounded-lg border border-forest-200 bg-forest-50 px-4 py-3 text-sm text-forest-700">
              {saveNote}
            </div>
          )}

          <div className="grid gap-6 md:grid-cols-2">
            <Select
              label="Wave"
              value={form.wave_number === null || form.wave_number === undefined ? '' : String(form.wave_number)}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  wave_number: e.target.value === '' ? null : Number(e.target.value),
                }))
              }
              options={[
                { value: '', label: 'No wave (fallback)' },
                ...[1, 2, 3, 4, 5, 6, 7].map((n) => ({
                  value: String(n),
                  label: `Wave ${n}`,
                })),
              ]}
            />

            <Select
              label="Status"
              value={form.status ?? 'active'}
              onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
              options={[
                { value: 'active', label: 'Active' },
                { value: 'waiting_for_next_wave', label: 'Waiting for next wave' },
              ]}
              hint="The only two values the database accepts."
            />
          </div>

          <div className="mt-6 space-y-4 border-t border-sage-100 pt-6">
            <Toggle
              label="Founding member"
              description="Grants founding standing on this record."
              checked={Boolean(form.is_founding_member)}
              onChange={(e) =>
                setForm((f) => ({ ...f, is_founding_member: e.target.checked }))
              }
            />

            <Toggle
              label="Price locked"
              description="Does not move the public counter. That counts positions at or under 100, and never reads this flag."
              checked={Boolean(form.price_locked)}
              onChange={(e) => setForm((f) => ({ ...f, price_locked: e.target.checked }))}
            />

            <Toggle
              label="Tester"
              description="Our decision, kept separate from their request below so one never overwrites the other."
              checked={Boolean(form.is_tester)}
              onChange={(e) => setForm((f) => ({ ...f, is_tester: e.target.checked }))}
            />
          </div>

          <div className="mt-6 space-y-4 border-t border-sage-100 pt-6">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-sage-400">
              Creator
            </h3>
            <Toggle
              label="Creator"
              checked={Boolean(form.is_creator)}
              onChange={(e) => setForm((f) => ({ ...f, is_creator: e.target.checked }))}
            />
            <Toggle
              label="Founding creator"
              checked={Boolean(form.is_founding_member_creator)}
              onChange={(e) =>
                setForm((f) => ({ ...f, is_founding_member_creator: e.target.checked }))
              }
            />
            <Select
              label="Creator wave"
              value={
                form.creator_wave_number === null || form.creator_wave_number === undefined
                  ? ''
                  : String(form.creator_wave_number)
              }
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  creator_wave_number:
                    e.target.value === '' ? null : Number(e.target.value),
                }))
              }
              options={[
                { value: '', label: 'None' },
                { value: '1', label: 'C1' },
                { value: '2', label: 'C2' },
                { value: '3', label: 'C3' },
              ]}
            />
          </div>

          <div className="mt-6 flex items-center justify-between gap-4 border-t border-sage-100 pt-6">
            <span className="text-sm text-sage-500">
              {dirtyKeys.length === 0
                ? 'No changes'
                : `${dirtyKeys.length} unsaved change${dirtyKeys.length === 1 ? '' : 's'}`}
            </span>
            <div className="flex gap-2">
              <Button
                variant="secondary"
                size="sm"
                disabled={dirtyKeys.length === 0 || saving}
                onClick={() =>
                  setForm({
                    wave_number: user.wave_number,
                    status: user.status,
                    is_founding_member: user.is_founding_member,
                    is_founding_member_creator: user.is_founding_member_creator,
                    is_creator: user.is_creator,
                    creator_wave_number: user.creator_wave_number,
                    price_locked: user.price_locked,
                    is_tester: user.is_tester,
                  })
                }
              >
                Discard
              </Button>
              <Button
                variant="primary"
                size="sm"
                loading={saving}
                disabled={dirtyKeys.length === 0 || saving}
                onClick={handleSave}
              >
                Save changes
              </Button>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* ------------------------------------------------------------------ */}
      {/* FACTS + ACCESS                                                      */}
      {/* ------------------------------------------------------------------ */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader title="Signup" />
          <CardBody>
            <Fact label="Joined" value={formatDate(user.created_at)} />
            <Fact
              label="Last updated"
              value={user.updated_at ? formatDate(user.updated_at) : 'Never'}
            />
            <Fact
              label="Position"
              value={user.waitlist_position ?? 'Not assigned'}
            />
            <Fact label="Segment" value={user.segment ?? 'Not set'} />
            <Fact
              label="Subscribed"
              value={user.unsubscribed_at ? 'No' : 'Yes'}
            />
          </CardBody>
        </Card>

        <Card>
          <CardHeader
            title="What they asked for"
            subtitle="Their own declarations. Read only."
          />
          <CardBody>
            <Fact
              label="Wants tester access"
              value={user.wants_tester_access ? 'Yes' : 'No'}
            />
            <Fact label="Wants beta" value={user.wants_beta ? 'Yes' : 'No'} />
            <Fact label="Text opt in" value={user.text_opt_in ? 'Yes' : 'No'} />
            <Fact label="Phone" value={user.phone_number ?? 'Not given'} />
          </CardBody>
        </Card>
      </div>

      <Card>
        <CardHeader
          title="App access"
          subtitle="Sets access and sends the matching follow-up email. There is no revoke action, so this only goes one way."
        />
        <CardBody>
          {grantError && (
            <div className="mb-4">
              <ErrorBanner title="Could not grant access" message={grantError} />
            </div>
          )}
          {grantNote && (
            <div className="mb-4 rounded-lg border border-forest-200 bg-forest-50 px-4 py-3 text-sm text-forest-700">
              {grantNote}
            </div>
          )}

          {user.has_access ? (
            <div className="flex items-center gap-3">
              <Badge variant="success">Access granted</Badge>
              <span className="text-sm text-sage-500">
                Granting again would do nothing, so there is no button here.
              </span>
            </div>
          ) : user.unsubscribed_at ? (
            <p className="text-sm text-sage-500">
              This person has unsubscribed, and the grant action skips
              unsubscribed records. Nothing to do here.
            </p>
          ) : (
            <Button
              variant="primary"
              size="sm"
              loading={granting}
              disabled={granting}
              onClick={handleGrantAccess}
            >
              Grant app access
            </Button>
          )}
        </CardBody>
      </Card>

      {/* ------------------------------------------------------------------ */}
      {/* IRREVERSIBLE                                                        */}
      {/* ------------------------------------------------------------------ */}
      <Card variant="error">
        <CardHeader
          title="Irreversible"
          subtitle="These act immediately and are not part of the save above."
        />
        <CardBody>
          <div className="space-y-6">
            <RegenerateTokenPanel email={user.email} />
            <div className="border-t border-sage-100 pt-6">
              <AnonymizeUserPanel email={user.email} onUserAnonymized={fetchUserData} />
            </div>
            <div className="border-t border-sage-100 pt-6">
              <DeleteUserPanel email={user.email} />
            </div>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
