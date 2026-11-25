import { useState, useEffect, useCallback, useRef } from 'react';
import { getAdminToken } from '@/lib/adminAuth';
import {
  Button,
  Badge,
  FilterSelect,
  PageHeader,
  ErrorBanner,
  LoadingState,
} from '@/pages/admin/components/ui';
import {
  OUTREACH_REMOVED,
  OUTREACH_STATUSES,
  OUTREACH_STATUS_BADGE,
  OUTREACH_STATUS_LABELS,
  type OutreachStatus,
} from '@/lib/outreachStatus';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface WaitlistUser {
  id: string;
  email: string;
  // Null for people who signed up before the name was asked for (#40).
  first_name: string | null;
  created_at: string;
  has_access: boolean;
  unsubscribed_at: string | null;
  wave_number: number | null;
  creator_wave_number: number | null;
  is_creator: boolean;
  is_founding_member: boolean;
  wants_tester_access: boolean;
  // Outreach row (#26). Null when it was missing: shown as unknown, never as
  // Not sent, and the row cannot be ticked.
  outreach: {
    outreach_status: OutreachStatus;
    last_emailed_on: string | null;
    resignup_attempts: number;
  } | null;
}

type OutreachFilter = 'all' | OutreachStatus;

const OUTREACH_FILTER_OPTIONS: { value: OutreachFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  ...OUTREACH_STATUSES.map((s) => ({ value: s as OutreachFilter, label: OUTREACH_STATUS_LABELS[s] })),
];

function isRemoved(user: WaitlistUser): boolean {
  return user.outreach?.outreach_status === OUTREACH_REMOVED;
}

interface GrantResult {
  granted: number;
  skipped: number;
  failed: number;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getRoleLabel(user: WaitlistUser): string {
  if (user.is_founding_member) return 'Founding';
  if (user.wants_tester_access) return user.is_creator ? 'Tester Creator' : 'Tester';
  if (user.is_creator && user.creator_wave_number) return `Creator C${user.creator_wave_number}`;
  if (user.wave_number) return `Wave ${user.wave_number}`;
  return 'General';
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function AccessManagementPage() {
  const [users, setUsers] = useState<WaitlistUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [selectNextN, setSelectNextN] = useState('10');
  const [granting, setGranting] = useState(false);
  const [grantResult, setGrantResult] = useState<GrantResult | null>(null);
  const [outreachFilter, setOutreachFilter] = useState<OutreachFilter>('all');

  const loadUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const adminToken = await getAdminToken();
      const res = await fetch('/api/admin/waitlist-users', {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      if (!res.ok) throw new Error(`Failed to load users (${res.status})`);
      const data = await res.json();
      setUsers(data.users ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load users');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  // Rows shown under the current outreach filter.
  const visibleUsers =
    outreachFilter === 'all'
      ? users
      : users.filter(u => u.outreach?.outreach_status === outreachFilter);

  // Eligible = no access, not unsubscribed, outreach known and not Removed (#26).
  // Selection works on the rows you can see.
  const eligible = visibleUsers.filter(
    u => !u.has_access && !u.unsubscribed_at && u.outreach !== null && !isRemoved(u)
  );

  // Removed people are left out of the waitlist counts (#26).
  const counted = users.filter(u => !isRemoved(u));
  const removedCount = users.length - counted.length;

  function handleSelectAll(checked: boolean) {
    if (checked) {
      setSelectedIds(new Set(eligible.map(u => u.id)));
    } else {
      setSelectedIds(new Set());
    }
  }

  function handleToggleRow(id: string) {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  function handleSelectNext() {
    const n = parseInt(selectNextN, 10);
    if (!n || n <= 0) return;
    const nextIds = eligible.slice(0, n).map(u => u.id);
    setSelectedIds(new Set(nextIds));
  }

  async function handleGrant() {
    if (selectedIds.size === 0) return;

    const confirmed = window.confirm(
      `Grant access to ${selectedIds.size} user${selectedIds.size !== 1 ? 's' : ''}?\n\nThis will set has_access = true and send each user an access email.`
    );
    if (!confirmed) return;

    setGranting(true);
    setGrantResult(null);
    try {
      const adminToken = await getAdminToken();
      const res = await fetch('/api/admin/grant-access', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${adminToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userIds: Array.from(selectedIds) }),
      });
      if (!res.ok) throw new Error(`Grant failed (${res.status})`);
      const data = await res.json();
      setGrantResult({ granted: data.granted, skipped: data.skipped, failed: data.failed });
      setSelectedIds(new Set());
      await loadUsers();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Grant failed');
    } finally {
      setGranting(false);
    }
  }

  // Stats ignore the filter and leave Removed people out (#26).
  const totalGranted = counted.filter(u => u.has_access).length;
  const totalPending = counted.filter(
    u => !u.has_access && !u.unsubscribed_at && u.outreach !== null
  ).length;
  const allEligibleSelected =
    eligible.length > 0 && eligible.every(u => selectedIds.has(u.id));
  const someEligibleSelected =
    eligible.some(u => selectedIds.has(u.id)) && !allEligibleSelected;

  const selectAllRef = useRef<HTMLInputElement | null>(null);
  useEffect(() => {
    if (selectAllRef.current) {
      selectAllRef.current.indeterminate = someEligibleSelected;
    }
  }, [someEligibleSelected]);

  if (loading) {
    return <LoadingState message="Loading waitlist users..." />;
  }

  return (
    <div className="space-y-6">
      {/* Page header */}
      <PageHeader
        title="Access Management"
        subtitle="Grant waitlist users access to the app and send their access email."
      />

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-lg border border-sage-100 p-4">
          <p className="text-xs text-sage-500 uppercase tracking-wider font-medium mb-1">Total</p>
          <p className="text-2xl font-semibold text-sage-900">{counted.length}</p>
          {removedCount > 0 && (
            <p className="text-xs text-sage-500 mt-1">{removedCount} Removed, not counted</p>
          )}
        </div>
        <div className="bg-white rounded-lg border border-sage-100 p-4">
          <p className="text-xs text-forest-600 uppercase tracking-wider font-medium mb-1">Granted</p>
          <p className="text-2xl font-semibold text-forest-700">{totalGranted}</p>
        </div>
        <div className="bg-white rounded-lg border border-sage-100 p-4">
          <p className="text-xs text-sage-500 uppercase tracking-wider font-medium mb-1">Pending</p>
          <p className="text-2xl font-semibold text-sage-900">{totalPending}</p>
        </div>
      </div>

      {/* Error banner */}
      {error && (
        <ErrorBanner message={error} onDismiss={() => setError(null)} />
      )}

      {/* Grant result banner */}
      {grantResult && (
        <div className="bg-forest-50 border border-forest-200 rounded-lg p-4 flex items-center justify-between">
          <p className="text-sm font-medium text-forest-800">
            Done — {grantResult.granted} granted
            {grantResult.skipped > 0 && `, ${grantResult.skipped} skipped`}
            {grantResult.failed > 0 && `, ${grantResult.failed} failed`}
          </p>
          <button
            onClick={() => setGrantResult(null)}
            className="text-forest-600 hover:text-forest-800 text-xs font-medium"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Controls */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <span className="text-sm text-sage-600">Select next</span>
          <input
            type="number"
            value={selectNextN}
            onChange={e => setSelectNextN(e.target.value)}
            min="1"
            max="500"
            className="w-20 px-3 py-1.5 text-sm border border-sage-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-forest-500/30 focus:border-forest-400 bg-white"
          />
          <span className="text-sm text-sage-600">users</span>
          <Button variant="secondary" size="sm" onClick={handleSelectNext}>
            Select
          </Button>
        </div>
        <FilterSelect<OutreachFilter>
          label="Outreach"
          value={outreachFilter}
          options={OUTREACH_FILTER_OPTIONS}
          onChange={(value) => {
            setOutreachFilter(value);
            // A hidden row must never be granted, so selection resets with the filter.
            setSelectedIds(new Set());
          }}
        />
        <div className="ml-auto">
          <Button
            variant="primary"
            onClick={handleGrant}
            loading={granting}
            disabled={selectedIds.size === 0 || granting}
          >
            Grant Access to Selected ({selectedIds.size})
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-sage-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-sage-50/50 border-b border-sage-100">
                <th className="w-10 px-4 py-3 text-center">
                  <input
                    type="checkbox"
                    ref={selectAllRef}
                    checked={allEligibleSelected}
                    onChange={e => handleSelectAll(e.target.checked)}
                    disabled={eligible.length === 0}
                    className="rounded border-sage-300 text-forest-600 focus:ring-forest-500/30 disabled:opacity-30"
                  />
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-sage-500 uppercase tracking-wider w-14">
                  #
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-sage-500 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-sage-500 uppercase tracking-wider">
                  First name
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-sage-500 uppercase tracking-wider">
                  Signed Up
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-sage-500 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-sage-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-sage-500 uppercase tracking-wider">
                  Outreach
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-sage-50">
              {visibleUsers.map((user, index) => {
                const isUnsubscribed = !!user.unsubscribed_at;
                const isGranted = user.has_access;
                const isRemovedRow = isRemoved(user);
                const outreachUnknown = user.outreach === null;
                const isSelectable = !isUnsubscribed && !isGranted && !isRemovedRow && !outreachUnknown;
                const isSelected = selectedIds.has(user.id);

                return (
                  <tr
                    key={user.id}
                    className={`transition-colors ${
                      isUnsubscribed || isRemovedRow
                        ? 'opacity-40'
                        : isSelected
                        ? 'bg-forest-50/50'
                        : 'hover:bg-sage-50/30'
                    }`}
                  >
                    <td className="px-4 py-3 text-center">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        disabled={!isSelectable}
                        onChange={() => handleToggleRow(user.id)}
                        className="rounded border-sage-300 text-forest-600 focus:ring-forest-500/30 disabled:opacity-30"
                      />
                    </td>
                    <td className="px-4 py-3 text-sm text-sage-400 font-mono tabular-nums">
                      {index + 1}
                    </td>
                    <td className="px-4 py-3 text-sm text-sage-900 max-w-xs truncate">
                      {user.email}
                    </td>
                    <td className="px-4 py-3 text-sm max-w-[10rem] truncate">
                      {user.first_name && user.first_name.trim() !== '' ? (
                        <span className="text-sage-900">{user.first_name}</span>
                      ) : (
                        <span className="text-sage-400">Not given</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-sage-500 whitespace-nowrap">
                      {formatDate(user.created_at)}
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-sage-100 text-sage-700">
                        {getRoleLabel(user)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {isGranted ? (
                        <Badge variant="success" size="sm">Granted</Badge>
                      ) : isUnsubscribed ? (
                        <Badge variant="default" size="sm">Unsubscribed</Badge>
                      ) : (
                        <Badge variant="warning" size="sm">Pending</Badge>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap items-center gap-1.5">
                        {user.outreach ? (
                          <Badge variant={OUTREACH_STATUS_BADGE[user.outreach.outreach_status]} size="sm">
                            {OUTREACH_STATUS_LABELS[user.outreach.outreach_status]}
                          </Badge>
                        ) : (
                          <Badge variant="default" size="sm">Unknown</Badge>
                        )}
                        {user.outreach && user.outreach.resignup_attempts > 0 && (
                          <Badge variant="critical" size="sm">Re-signed up</Badge>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {users.length > 0 && visibleUsers.length === 0 && (
            <div className="py-12 text-center">
              <p className="text-sage-500 text-sm">No signups with this outreach status.</p>
            </div>
          )}

          {users.length === 0 && (
            <div className="py-12 text-center">
              <p className="text-sage-500 text-sm">No waitlist users found.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
