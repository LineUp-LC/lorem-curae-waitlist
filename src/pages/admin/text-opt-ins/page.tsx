import { useState, useEffect, useCallback } from 'react';
import { getAdminToken } from '@/lib/adminAuth';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface OptedInUser {
  email: string;
  phone_number: string | null;
  wave_number: number | null;
  is_founding_member: boolean;
  text_opt_in_offer_sent_at: string | null;
  created_at: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function TextOptInsPage() {
  const [users, setUsers] = useState<OptedInUser[]>([]);
  const [slotsRemaining, setSlotsRemaining] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const token = await getAdminToken();
      const res = await fetch('/api/admin/text-opt-in-users', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(`Failed to load (${res.status})`);
      const data = await res.json() as { users: OptedInUser[]; slots_remaining: number };
      setUsers(data.users ?? []);
      setSlotsRemaining(data.slots_remaining ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-sage-900">Text Opt-ins</h1>
          <p className="mt-1 text-sage-500">Founding members who opted in for personal texts from Ethan</p>
        </div>
        <div className="flex items-center gap-4">
          {slotsRemaining !== null && (
            <div className="text-right">
              <p className="text-sm font-medium text-sage-700">{slotsRemaining} slots remaining</p>
              <p className="text-xs text-sage-400">of 100 total</p>
            </div>
          )}
          <button
            onClick={fetchData}
            disabled={loading}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-sage-700 bg-white border border-sage-200 rounded-lg hover:bg-sage-50 transition-colors disabled:opacity-50"
          >
            <svg
              className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-coral-50 border border-coral-100 rounded-lg p-4 text-coral-700 text-sm">
          {error}
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-xl border border-sage-100 overflow-hidden">
        {loading ? (
          <div className="p-8 flex justify-center">
            <div className="w-6 h-6 border-2 border-sage-300 border-t-sage-600 rounded-full animate-spin" />
          </div>
        ) : users.length === 0 ? (
          <div className="p-8 text-center text-sage-500 text-sm">No opted-in members yet</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-sage-50/50">
                  <th className="px-6 py-3 text-left text-xs font-semibold text-sage-600 uppercase tracking-wider">#</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-sage-600 uppercase tracking-wider">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-sage-600 uppercase tracking-wider">Phone</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-sage-600 uppercase tracking-wider">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-sage-600 uppercase tracking-wider">Offer sent</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-sage-100">
                {users.map((user, idx) => (
                  <tr key={user.email} className={idx % 2 === 0 ? 'bg-white' : 'bg-sage-50/30'}>
                    <td className="px-6 py-3 text-sm text-sage-500">#{idx + 1}</td>
                    <td className="px-6 py-3 text-sm text-sage-800">{user.email}</td>
                    <td className="px-6 py-3 text-sm font-mono text-sage-700">{user.phone_number ?? '—'}</td>
                    <td className="px-6 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                        user.is_founding_member
                          ? 'bg-forest-50 text-forest-700'
                          : 'bg-sage-100 text-sage-600'
                      }`}>
                        {user.is_founding_member ? 'Founding member' : `Wave ${user.wave_number ?? '—'}`}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-sm text-sage-500">{formatDate(user.text_opt_in_offer_sent_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
