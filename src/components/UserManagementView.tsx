import React, { useState, useEffect } from 'react';
import { Users, UserPlus, Shield, Check, X, KeyRound, Trash2, Edit3, ShieldAlert } from 'lucide-react';
import { User } from '../types';
import { formatDisplayDateTime } from '../utils/dateUtils';

interface UserManagementViewProps {
  currentUser: User;
  onShowToast: (type: 'success' | 'error' | 'warning' | 'info', msg: string) => void;
}

export const UserManagementView: React.FC<UserManagementViewProps> = ({
  currentUser,
  onShowToast
}) => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [resettingUser, setResettingUser] = useState<User | null>(null);
  const [deletingUser, setDeletingUser] = useState<User | null>(null);

  // Form states for Add User
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'Administrator' | 'User'>('User');
  const [securityQuestion, setSecurityQuestion] = useState('What court district is this machine located in?');
  const [securityAnswer, setSecurityAnswer] = useState('');

  // Form state for Reset Password
  const [newAdminSetPassword, setNewAdminSetPassword] = useState('');

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/users');
      const data = await res.json();
      if (data.users) {
        setUsers(data.users);
      }
    } catch {
      onShowToast('error', 'Failed to load user list.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !username || !email || !password) {
      onShowToast('warning', 'Please complete all required fields.');
      return;
    }

    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName,
          username,
          email,
          password,
          role,
          securityQuestion,
          securityAnswer: securityAnswer || 'court'
        })
      });

      const data = await res.json();
      if (!res.ok) {
        onShowToast('error', data.error || 'Failed to create user.');
        return;
      }

      onShowToast('success', 'User account created successfully.');
      setShowAddModal(false);
      setFullName('');
      setUsername('');
      setEmail('');
      setPassword('');
      setSecurityAnswer('');
      fetchUsers();
    } catch {
      onShowToast('error', 'Network/local error creating user.');
    }
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    try {
      const res = await fetch(`/api/users/${editingUser.userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: editingUser.fullName,
          email: editingUser.email,
          role: editingUser.role,
          isActive: editingUser.isActive
        })
      });

      const data = await res.json();
      if (!res.ok) {
        onShowToast('error', data.error || 'Failed to update user.');
        return;
      }

      onShowToast('success', 'User account updated successfully.');
      setEditingUser(null);
      fetchUsers();
    } catch {
      onShowToast('error', 'Error updating user.');
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resettingUser || !newAdminSetPassword) return;

    try {
      const res = await fetch(`/api/users/${resettingUser.userId}/reset-password`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newPassword: newAdminSetPassword })
      });

      const data = await res.json();
      if (!res.ok) {
        onShowToast('error', data.error || 'Failed to reset password.');
        return;
      }

      onShowToast('success', `Password for @${resettingUser.username} updated.`);
      setResettingUser(null);
      setNewAdminSetPassword('');
    } catch {
      onShowToast('error', 'Error resetting password.');
    }
  };

  const handleDeleteUser = async () => {
    if (!deletingUser) return;

    try {
      const res = await fetch(`/api/users/${deletingUser.userId}?currentUserId=${currentUser.userId}`, {
        method: 'DELETE'
      });

      const data = await res.json();
      if (!res.ok) {
        onShowToast('error', data.error || 'Failed to delete user.');
        return;
      }

      onShowToast('success', 'User deleted successfully.');
      setDeletingUser(null);
      fetchUsers();
    } catch {
      onShowToast('error', 'Error deleting user.');
    }
  };

  return (
    <div className="space-y-5">
      <div className="bg-white border border-slate-200 rounded-lg shadow-xs overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <Users className="w-5 h-5 text-amber-600" />
            <div>
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide font-serif">
                User Management & Roles
              </h3>
              <p className="text-[11px] text-slate-500">
                Manage local court users, roles (Administrator / User), and credentials
              </p>
            </div>
          </div>

          <button
            onClick={() => setShowAddModal(true)}
            className="px-3.5 py-1.5 text-xs font-bold rounded bg-slate-900 hover:bg-slate-800 text-white flex items-center gap-1.5 transition-colors shadow-xs"
          >
            <UserPlus className="w-4 h-4 text-amber-400" />
            <span>+ Add New User</span>
          </button>
        </div>

        {/* User Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-100 text-slate-700">
              <tr>
                <th className="py-3 px-4 font-bold uppercase text-[10px]">Full Name</th>
                <th className="py-3 px-4 font-bold uppercase text-[10px]">Username</th>
                <th className="py-3 px-4 font-bold uppercase text-[10px]">Email</th>
                <th className="py-3 px-4 font-bold uppercase text-[10px]">Role</th>
                <th className="py-3 px-4 font-bold uppercase text-[10px]">Status</th>
                <th className="py-3 px-4 font-bold uppercase text-[10px]">Last Login</th>
                <th className="py-3 px-4 font-bold uppercase text-[10px] text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {users.map((u) => (
                <tr key={u.userId} className="hover:bg-slate-50 transition-colors">
                  <td className="py-3 px-4 font-semibold text-slate-900">
                    {u.fullName} {u.userId === currentUser.userId && '(You)'}
                  </td>
                  <td className="py-3 px-4 text-slate-700 font-mono text-[11px]">
                    @{u.username}
                  </td>
                  <td className="py-3 px-4 text-slate-600">{u.email}</td>
                  <td className="py-3 px-4">
                    <span className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded border ${
                      u.role === 'Administrator'
                        ? 'bg-amber-50 text-amber-800 border-amber-200'
                        : 'bg-slate-100 text-slate-700 border-slate-200'
                    }`}>
                      {u.role === 'Administrator' && <Shield className="w-3 h-3 text-amber-600" />}
                      {u.role}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span className={`text-[11px] font-semibold px-2 py-0.5 rounded ${
                      u.isActive === 1
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-rose-50 text-rose-700 border border-rose-200'
                    }`}>
                      {u.isActive === 1 ? 'Active' : 'Deactivated'}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-slate-500 text-[11px]">
                    {u.lastLogin ? formatDisplayDateTime(u.lastLogin) : 'Never'}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <button
                        onClick={() => setEditingUser(u)}
                        className="p-1 text-slate-600 hover:text-slate-900 hover:bg-slate-200 rounded transition-colors"
                        title="Edit User Details"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => {
                          setResettingUser(u);
                          setNewAdminSetPassword('');
                        }}
                        className="p-1 text-amber-700 hover:text-amber-900 hover:bg-amber-100 rounded transition-colors"
                        title="Reset User Password"
                      >
                        <KeyRound className="w-3.5 h-3.5" />
                      </button>
                      {u.userId !== currentUser.userId && (
                        <button
                          onClick={() => setDeletingUser(u)}
                          className="p-1 text-rose-600 hover:text-rose-900 hover:bg-rose-100 rounded transition-colors"
                          title="Delete User"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add User Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white rounded-lg shadow-2xl border border-slate-300 w-full max-w-lg overflow-hidden">
            <div className="px-5 py-3.5 bg-slate-900 text-white flex items-center justify-between">
              <h3 className="text-sm font-bold font-serif">Create New User Account</h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleCreateUser} className="p-5 space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Johnathan Miller"
                  className="w-full px-3 py-1.5 border border-slate-300 rounded text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">Username</label>
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="e.g. jmiller"
                    className="w-full px-3 py-1.5 border border-slate-300 rounded text-xs"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">Email</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="jmiller@court.local"
                    className="w-full px-3 py-1.5 border border-slate-300 rounded text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">Temporary Password</label>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Min 6 characters"
                    className="w-full px-3 py-1.5 border border-slate-300 rounded text-xs"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">System Role</label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as any)}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded text-xs font-semibold"
                  >
                    <option value="User">User (Schedule CRUD)</option>
                    <option value="Administrator">Administrator (Full Access)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">Security Question</label>
                <input
                  type="text"
                  required
                  value={securityQuestion}
                  onChange={(e) => setSecurityQuestion(e.target.value)}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded text-xs"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">Security Answer (For Offline Reset)</label>
                <input
                  type="text"
                  required
                  value={securityAnswer}
                  onChange={(e) => setSecurityAnswer(e.target.value)}
                  placeholder="e.g. District Bench"
                  className="w-full px-3 py-1.5 border border-slate-300 rounded text-xs"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3 py-1.5 rounded border border-slate-300 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded bg-slate-900 hover:bg-slate-800 text-white font-bold"
                >
                  Create Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white rounded-lg shadow-2xl border border-slate-300 w-full max-w-md overflow-hidden">
            <div className="px-5 py-3.5 bg-slate-900 text-white flex items-center justify-between">
              <h3 className="text-sm font-bold font-serif">Edit User: @{editingUser.username}</h3>
              <button onClick={() => setEditingUser(null)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleUpdateUser} className="p-5 space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={editingUser.fullName}
                  onChange={(e) => setEditingUser({ ...editingUser, fullName: e.target.value })}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded text-xs"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">Email</label>
                <input
                  type="email"
                  required
                  value={editingUser.email}
                  onChange={(e) => setEditingUser({ ...editingUser, email: e.target.value })}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded text-xs"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">Role</label>
                <select
                  value={editingUser.role}
                  onChange={(e) => setEditingUser({ ...editingUser, role: e.target.value as any })}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded text-xs font-semibold"
                >
                  <option value="User">User</option>
                  <option value="Administrator">Administrator</option>
                </select>
              </div>
              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">Account Status</label>
                <select
                  value={editingUser.isActive}
                  onChange={(e) => setEditingUser({ ...editingUser, isActive: Number(e.target.value) })}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded text-xs font-semibold"
                >
                  <option value={1}>Active</option>
                  <option value={0}>Deactivated</option>
                </select>
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="px-3 py-1.5 rounded border border-slate-300 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded bg-slate-900 hover:bg-slate-800 text-white font-bold"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Admin Reset Password Modal */}
      {resettingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white rounded-lg shadow-2xl border border-amber-300 w-full max-w-md overflow-hidden">
            <div className="px-5 py-3.5 bg-amber-600 text-white flex items-center justify-between">
              <h3 className="text-sm font-bold font-serif">Reset Password for @{resettingUser.username}</h3>
              <button onClick={() => setResettingUser(null)} className="text-amber-200 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleResetPassword} className="p-5 space-y-3 text-xs">
              <p className="text-slate-600">
                Set a new password for <strong>{resettingUser.fullName}</strong>. They will use this new password on their next local login.
              </p>
              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">New Password</label>
                <input
                  type="password"
                  required
                  placeholder="Enter new password (min 6 chars)"
                  value={newAdminSetPassword}
                  onChange={(e) => setNewAdminSetPassword(e.target.value)}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded text-xs"
                />
              </div>
              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setResettingUser(null)}
                  className="px-3 py-1.5 rounded border border-slate-300 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded bg-amber-600 hover:bg-amber-700 text-white font-bold"
                >
                  Reset Password
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete User Confirmation */}
      {deletingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white rounded-lg shadow-2xl border border-rose-300 w-full max-w-md overflow-hidden">
            <div className="px-5 py-3.5 bg-rose-600 text-white flex items-center justify-between">
              <h3 className="text-sm font-bold font-serif">Delete User Account</h3>
              <button onClick={() => setDeletingUser(null)} className="text-rose-200 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-5 space-y-3 text-xs">
              <p className="text-slate-700">
                Are you sure you want to delete user account <strong>{deletingUser.fullName}</strong> (@{deletingUser.username})?
              </p>
              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setDeletingUser(null)}
                  className="px-3 py-1.5 rounded border border-slate-300 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleDeleteUser}
                  className="px-4 py-1.5 rounded bg-rose-600 hover:bg-rose-700 text-white font-bold"
                >
                  Confirm Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
