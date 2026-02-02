import { useState, useEffect, useCallback, FormEvent } from 'react';

// Types for API responses
interface RoleUser {
  email: string;
}

interface Role {
  role: string;
  users: RoleUser[];
}

interface RolePermissions {
  role: string;
  permissions: string[];
}

interface RolesResponse {
  roles: Role[];
}

interface PermissionsResponse {
  permissions: RolePermissions[];
}

// Role color mapping
function getRoleColor(role: string): string {
  const roleLower = role.toLowerCase();
  if (roleLower.includes('admin') || roleLower.includes('super')) {
    return 'bg-coral-100 text-coral-800 border-coral-200';
  }
  if (roleLower.includes('editor') || roleLower.includes('manager')) {
    return 'bg-cream-100 text-cream-800 border-cream-200';
  }
  if (roleLower.includes('viewer') || roleLower.includes('read')) {
    return 'bg-sage-100 text-sage-700 border-sage-200';
  }
  return 'bg-forest-100 text-forest-800 border-forest-200';
}

// Permission badge color
function getPermissionColor(permission: string): string {
  const permLower = permission.toLowerCase();
  if (permLower.includes('delete') || permLower.includes('destroy')) {
    return 'bg-coral-50 text-coral-700';
  }
  if (permLower.includes('write') || permLower.includes('create') || permLower.includes('update')) {
    return 'bg-cream-50 text-cream-700';
  }
  if (permLower.includes('read') || permLower.includes('view')) {
    return 'bg-forest-50 text-forest-700';
  }
  return 'bg-sage-50 text-sage-600';
}

// Modal component
function Modal({
  isOpen,
  onClose,
  title,
  children,
}: {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-sage-900/50 transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative w-full max-w-md transform overflow-hidden rounded-xl bg-white shadow-xl transition-all">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-sage-100">
            <h3 className="text-lg font-medium text-sage-900">{title}</h3>
            <button
              onClick={onClose}
              className="text-sage-400 hover:text-sage-600 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Content */}
          <div className="px-6 py-4">{children}</div>
        </div>
      </div>
    </div>
  );
}

export default function RolesPermissionsPage() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<RolePermissions[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Assign modal state
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [assignRole, setAssignRole] = useState<string>('');
  const [assignEmail, setAssignEmail] = useState('');
  const [assigning, setAssigning] = useState(false);
  const [assignError, setAssignError] = useState<string | null>(null);
  const [assignSuccess, setAssignSuccess] = useState(false);

  // Revoke state
  const [revokingKey, setRevokingKey] = useState<string | null>(null);
  const [revokeError, setRevokeError] = useState<string | null>(null);
  const [revokeSuccess, setRevokeSuccess] = useState<string | null>(null);

  const getAdminSecret = () => import.meta.env.VITE_ADMIN_SECRET;

  // Fetch roles
  const fetchRoles = useCallback(async () => {
    try {
      const adminSecret = getAdminSecret();
      if (!adminSecret) throw new Error('Admin credentials not configured');

      const response = await fetch('/api/admin/roles', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${adminSecret}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        if (response.status === 401) throw new Error('Unauthorized');
        throw new Error(`Failed to fetch roles (${response.status})`);
      }

      const data: RolesResponse = await response.json();
      setRoles(data.roles || []);
    } catch (err) {
      console.error('[Roles] Fetch failed:', err);
      throw err;
    }
  }, []);

  // Fetch permissions
  const fetchPermissions = useCallback(async () => {
    try {
      const adminSecret = getAdminSecret();
      if (!adminSecret) throw new Error('Admin credentials not configured');

      const response = await fetch('/api/admin/permissions', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${adminSecret}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        if (response.status === 401) throw new Error('Unauthorized');
        throw new Error(`Failed to fetch permissions (${response.status})`);
      }

      const data: PermissionsResponse = await response.json();
      setPermissions(data.permissions || []);
    } catch (err) {
      console.error('[Permissions] Fetch failed:', err);
      throw err;
    }
  }, []);

  // Fetch all data
  const fetchAll = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      await Promise.all([fetchRoles(), fetchPermissions()]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }, [fetchRoles, fetchPermissions]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  // Get permissions for a role
  const getPermissionsForRole = (role: string): string[] => {
    const rolePerms = permissions.find((p) => p.role === role);
    return rolePerms?.permissions || [];
  };

  // Open assign modal
  const openAssignModal = (role: string) => {
    setAssignRole(role);
    setAssignEmail('');
    setAssignError(null);
    setAssignSuccess(false);
    setAssignModalOpen(true);
  };

  // Close assign modal
  const closeAssignModal = () => {
    setAssignModalOpen(false);
    setAssignRole('');
    setAssignEmail('');
    setAssignError(null);
    setAssignSuccess(false);
  };

  // Handle assign role
  const handleAssignRole = async (e: FormEvent) => {
    e.preventDefault();

    if (!assignEmail.trim() || !assignRole) return;

    try {
      setAssigning(true);
      setAssignError(null);
      setAssignSuccess(false);

      const adminSecret = getAdminSecret();
      if (!adminSecret) throw new Error('Admin credentials not configured');

      const response = await fetch('/api/admin/assign-role', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${adminSecret}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: assignEmail.trim(),
          role: assignRole,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to assign role (${response.status})`);
      }

      setAssignSuccess(true);

      // Refresh roles list
      await fetchRoles();

      // Close modal after short delay
      setTimeout(() => {
        closeAssignModal();
      }, 1500);
    } catch (err) {
      console.error('[Roles] Assign failed:', err);
      setAssignError(err instanceof Error ? err.message : 'Failed to assign role');
    } finally {
      setAssigning(false);
    }
  };

  // Handle revoke role
  const handleRevokeRole = async (email: string, role: string) => {
    const key = `${role}:${email}`;

    try {
      setRevokingKey(key);
      setRevokeError(null);
      setRevokeSuccess(null);

      const adminSecret = getAdminSecret();
      if (!adminSecret) throw new Error('Admin credentials not configured');

      const response = await fetch('/api/admin/revoke-role', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${adminSecret}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, role }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to revoke role (${response.status})`);
      }

      setRevokeSuccess(key);

      // Refresh roles list
      await fetchRoles();

      // Clear success after delay
      setTimeout(() => {
        setRevokeSuccess(null);
      }, 3000);
    } catch (err) {
      console.error('[Roles] Revoke failed:', err);
      setRevokeError(err instanceof Error ? err.message : 'Failed to revoke role');
    } finally {
      setRevokingKey(null);
    }
  };

  // Calculate total users
  const totalUsers = roles.reduce((sum, role) => sum + role.users.length, 0);

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-sage-900">Roles & Permissions</h1>
          <p className="mt-1 text-sage-500">
            Manage access control for the admin system
          </p>
        </div>
        <button
          onClick={fetchAll}
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

      {/* Summary stats */}
      {!loading && !error && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white rounded-xl border border-sage-100 p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-sage-100 flex items-center justify-center">
                <svg className="w-5 h-5 text-sage-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <div>
                <p className="text-2xl font-semibold text-sage-900">{roles.length}</p>
                <p className="text-sm text-sage-500">Roles</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-sage-100 p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-forest-100 flex items-center justify-center">
                <svg className="w-5 h-5 text-forest-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <div>
                <p className="text-2xl font-semibold text-sage-900">{totalUsers}</p>
                <p className="text-sm text-sage-500">Assigned Users</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-sage-100 p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-cream-100 flex items-center justify-center">
                <svg className="w-5 h-5 text-cream-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                </svg>
              </div>
              <div>
                <p className="text-2xl font-semibold text-sage-900">
                  {permissions.reduce((sum, p) => sum + p.permissions.length, 0)}
                </p>
                <p className="text-sm text-sage-500">Total Permissions</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Error banner */}
      {error && (
        <div className="bg-coral-50 border border-coral-200 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <svg className="w-5 h-5 text-coral-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="flex-1">
              <p className="text-sm font-medium text-coral-800">Failed to load roles and permissions</p>
              <p className="text-sm text-coral-600">{error}</p>
            </div>
            <button
              onClick={fetchAll}
              className="text-sm text-coral-700 hover:text-coral-900 font-medium"
            >
              Retry
            </button>
          </div>
        </div>
      )}

      {/* Revoke error banner */}
      {revokeError && (
        <div className="bg-coral-50 border border-coral-200 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <svg className="w-5 h-5 text-coral-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-sm text-coral-700">{revokeError}</p>
            <button
              onClick={() => setRevokeError(null)}
              className="ml-auto text-coral-400 hover:text-coral-600"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Roles list */}
      <div className="space-y-4">
        {loading ? (
          <div className="bg-white rounded-xl border border-sage-100 p-6">
            <div className="space-y-6">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="space-y-3">
                  <div className="h-6 bg-sage-100 rounded w-32 animate-pulse" />
                  <div className="h-4 bg-sage-100 rounded w-48 animate-pulse" />
                  <div className="flex gap-2">
                    <div className="h-6 bg-sage-100 rounded w-20 animate-pulse" />
                    <div className="h-6 bg-sage-100 rounded w-24 animate-pulse" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : roles.length === 0 ? (
          <div className="bg-white rounded-xl border border-sage-100 p-12 text-center">
            <svg className="w-12 h-12 mx-auto mb-4 text-sage-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            <p className="text-sage-600 font-medium">No roles configured</p>
            <p className="text-sm text-sage-500 mt-1">Roles will appear here when created</p>
          </div>
        ) : (
          roles.map((role) => {
            const rolePermissions = getPermissionsForRole(role.role);

            return (
              <div
                key={role.role}
                className="bg-white rounded-xl border border-sage-100 overflow-hidden"
              >
                {/* Role header */}
                <div className="px-6 py-4 border-b border-sage-100 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span
                      className={`inline-flex items-center px-3 py-1 rounded-lg text-sm font-medium border ${getRoleColor(
                        role.role
                      )}`}
                    >
                      {role.role}
                    </span>
                    <span className="text-sm text-sage-500">
                      {role.users.length} user{role.users.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                  <button
                    onClick={() => openAssignModal(role.role)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-sage-700 bg-sage-100 rounded-lg hover:bg-sage-200 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    Assign User
                  </button>
                </div>

                <div className="p-6 space-y-4">
                  {/* Permissions */}
                  <div>
                    <p className="text-xs font-medium text-sage-500 uppercase tracking-wider mb-2">
                      Permissions
                    </p>
                    {rolePermissions.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {rolePermissions.map((perm) => (
                          <span
                            key={perm}
                            className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getPermissionColor(
                              perm
                            )}`}
                          >
                            {perm}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-sage-400 italic">No permissions defined</p>
                    )}
                  </div>

                  {/* Users */}
                  <div>
                    <p className="text-xs font-medium text-sage-500 uppercase tracking-wider mb-2">
                      Users
                    </p>
                    {role.users.length > 0 ? (
                      <div className="space-y-2">
                        {role.users.map((user) => {
                          const key = `${role.role}:${user.email}`;
                          const isRevoking = revokingKey === key;
                          const isSuccess = revokeSuccess === key;

                          return (
                            <div
                              key={user.email}
                              className={`flex items-center justify-between py-2 px-3 rounded-lg ${
                                isSuccess ? 'bg-forest-50' : 'bg-sage-50'
                              }`}
                            >
                              <span className="text-sm text-sage-700">{user.email}</span>
                              <button
                                onClick={() => handleRevokeRole(user.email, role.role)}
                                disabled={isRevoking}
                                className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-coral-600 hover:text-coral-800 hover:bg-coral-50 rounded transition-colors disabled:opacity-50"
                              >
                                {isRevoking ? (
                                  <>
                                    <svg className="w-3 h-3 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                    </svg>
                                    Revoking...
                                  </>
                                ) : isSuccess ? (
                                  <>
                                    <svg className="w-3 h-3 text-forest-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                    <span className="text-forest-600">Revoked</span>
                                  </>
                                ) : (
                                  <>
                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                    Revoke
                                  </>
                                )}
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="text-sm text-sage-400 italic">No users assigned to this role</p>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Assign Role Modal */}
      <Modal
        isOpen={assignModalOpen}
        onClose={closeAssignModal}
        title="Assign Role"
      >
        <form onSubmit={handleAssignRole} className="space-y-4">
          {/* Role display */}
          <div>
            <label className="block text-sm font-medium text-sage-700 mb-1.5">
              Role
            </label>
            <div
              className={`inline-flex items-center px-3 py-1.5 rounded-lg text-sm font-medium border ${getRoleColor(
                assignRole
              )}`}
            >
              {assignRole}
            </div>
          </div>

          {/* Email input */}
          <div>
            <label htmlFor="assign-email" className="block text-sm font-medium text-sage-700 mb-1.5">
              User Email
            </label>
            <input
              type="email"
              id="assign-email"
              value={assignEmail}
              onChange={(e) => setAssignEmail(e.target.value)}
              placeholder="user@example.com"
              required
              disabled={assigning}
              className="w-full px-3 py-2 text-sm border border-sage-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sage-500 focus:border-transparent disabled:bg-sage-50 disabled:text-sage-500"
            />
          </div>

          {/* Error message */}
          {assignError && (
            <div className="bg-coral-50 border border-coral-200 rounded-lg p-3">
              <div className="flex items-center gap-2 text-coral-700">
                <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-sm">{assignError}</span>
              </div>
            </div>
          )}

          {/* Success message */}
          {assignSuccess && (
            <div className="bg-forest-50 border border-forest-200 rounded-lg p-3">
              <div className="flex items-center gap-2 text-forest-700">
                <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-sm">Role assigned successfully!</span>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={closeAssignModal}
              disabled={assigning}
              className="px-4 py-2 text-sm font-medium text-sage-600 hover:text-sage-800 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!assignEmail.trim() || assigning || assignSuccess}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-sage-800 rounded-lg hover:bg-sage-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {assigning ? (
                <>
                  <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Assigning...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Assign Role
                </>
              )}
            </button>
          </div>
        </form>
      </Modal>

      {/* Help text */}
      <div className="text-center text-xs text-sage-400 py-2">
        Roles control what actions users can perform in the admin dashboard
      </div>
    </div>
  );
}
