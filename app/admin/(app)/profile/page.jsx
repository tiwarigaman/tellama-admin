'use client';

import { useCallback, useEffect, useState } from 'react';
import { AdminLoader } from '@/components/admin/AdminLoader';
import { getAdminProfile, logoutRequest, updateAdminProfile } from '@/lib/admin-api-client';

export default function AdminProfilePage() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [email, setEmail] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await getAdminProfile();
      const row = data?.data || data;
      setProfile(row || null);
      setEmail(row?.email || '');
    } catch (e) {
      setError(e?.message || 'Failed to load profile');
      setProfile(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const isBootstrap = profile?.kind === 'bootstrap' || profile?.role === 'SUPER_ADMIN';

  async function onSubmit(e) {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (!currentPassword.trim()) {
      setError('Current password is required.');
      return;
    }
    if (newPassword && newPassword.length < 8) {
      setError('New password must be at least 8 characters.');
      return;
    }
    if (newPassword && newPassword !== confirmNewPassword) {
      setError('New password and confirm password do not match.');
      return;
    }

    const body = {
      currentPassword: currentPassword.trim(),
      ...(newPassword ? { newPassword } : {}),
      ...(!isBootstrap ? { email: email.trim() || null } : {}),
    };

    setSaving(true);
    try {
      const res = await updateAdminProfile(body);
      const msg =
        res?.message ||
        'Profile updated. Please sign in again so fresh token claims are applied.';
      setSuccess(msg);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
      await load();
    } catch (e) {
      setError(e?.message || 'Could not update profile');
    } finally {
      setSaving(false);
    }
  }

  if (loading && !profile) return <AdminLoader />;

  return (
    <div>
      <h1 className="admin-page-title">My profile</h1>
      <p className="admin-muted" style={{ marginBottom: '1rem' }}>
        Update your own email/password. For security, current password is required.
      </p>

      {success ? <div className="admin-flash admin-flash--success">{success}</div> : null}
      {error ? <div className="admin-flash admin-flash--error">{error}</div> : null}

      <form onSubmit={onSubmit} className="admin-card" style={{ maxWidth: 720 }}>
        <div className="admin-form-section">
          <h2>Account</h2>
          <div className="admin-field">
            <label>Role</label>
            <input value={profile?.role || '—'} disabled />
          </div>
          <div className="admin-field">
            <label>{isBootstrap ? 'Username (bootstrap)' : 'Email'}</label>
            <input
              value={isBootstrap ? profile?.username || '' : email}
              onChange={(ev) => setEmail(ev.target.value)}
              type={isBootstrap ? 'text' : 'email'}
              disabled={isBootstrap}
              autoComplete="off"
            />
            {isBootstrap ? (
              <p className="admin-field-hint">
                Bootstrap super admin email cannot be changed here.
              </p>
            ) : null}
          </div>
        </div>

        <div className="admin-form-section">
          <h2>Password</h2>
          <div className="admin-field">
            <label>Current password *</label>
            <input
              type="password"
              value={currentPassword}
              onChange={(ev) => setCurrentPassword(ev.target.value)}
              required
              autoComplete="current-password"
            />
          </div>
          <div className="admin-field">
            <label>New password</label>
            <input
              type="password"
              value={newPassword}
              onChange={(ev) => setNewPassword(ev.target.value)}
              autoComplete="new-password"
              minLength={8}
              placeholder="Leave blank to keep current password"
            />
          </div>
          <div className="admin-field">
            <label>Confirm new password</label>
            <input
              type="password"
              value={confirmNewPassword}
              onChange={(ev) => setConfirmNewPassword(ev.target.value)}
              autoComplete="new-password"
              minLength={8}
              placeholder="Repeat new password"
            />
          </div>
        </div>

        <div className="admin-row-actions">
          <button type="submit" className="admin-btn admin-btn--primary" disabled={saving}>
            {saving ? 'Saving…' : 'Save profile'}
          </button>
          <button
            type="button"
            className="admin-btn admin-btn--ghost"
            onClick={async () => {
              try {
                await logoutRequest();
              } catch {}
              window.location.assign('/admin/login');
            }}
          >
            Sign out now
          </button>
        </div>
      </form>
    </div>
  );
}

