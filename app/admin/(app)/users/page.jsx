'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  createAdminUser,
  deleteStaffUser,
  getSessionRequest,
  listAdminUsers,
  updateStaffUserPassword,
} from '@/lib/admin-api-client';
import { AdminLoader } from '@/components/admin/AdminLoader';
import { StaffPasswordModal } from '@/components/admin/StaffPasswordModal';
import { ConfirmModal } from '@/components/ConfirmModal';
import { canManageStaffUsers } from '@/lib/tel-access-payload';

const ROLES = ['ADMIN', 'EDITOR', 'SEO_EDITOR'];

function staffRowId(row) {
  if (row?.id != null && String(row.id).length > 0) return String(row.id);
  if (row?.userId != null && String(row.userId).length > 0) return String(row.userId);
  return null;
}

function staffEmail(row) {
  return row?.email ?? row?.username ?? '';
}

export default function AdminUsersPage() {
  const [session, setSession] = useState(null);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [saving, setSaving] = useState(false);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('EDITOR');

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteBusy, setDeleteBusy] = useState(false);

  const [pwTarget, setPwTarget] = useState(null);
  const [pwBusy, setPwBusy] = useState(false);
  const [pwError, setPwError] = useState('');

  const allowed = canManageStaffUsers(session?.role);

  const sessionEmail = session?.email ? String(session.email).toLowerCase() : null;

  const load = useCallback(async () => {
    if (!allowed) return;
    setLoading(true);
    setError('');
    try {
      const data = await listAdminUsers();
      const list = Array.isArray(data?.data) ? data.data : data?.users || data?.items || [];
      setRows(Array.isArray(list) ? list : []);
    } catch (e) {
      setError(e?.message || 'Could not load the staff list. Check that tel-backend is running.');
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [allowed]);

  useEffect(() => {
    let cancelled = false;
    getSessionRequest().then((s) => {
      if (!cancelled) setSession(s);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (session && allowed) load();
    if (session && !allowed) setLoading(false);
  }, [session, allowed, load]);

  const roleLabels = useMemo(
    () => ({
      ADMIN: 'Full admin — can manage staff (this page) and most content.',
      EDITOR: 'Editor — can create and edit categories (within rules set by the server).',
      SEO_EDITOR: 'SEO editor — can edit SEO text on categories only, not structure.',
    }),
    [],
  );

  async function onCreate(e) {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (password.length < 8) {
      setError('Please use at least 8 characters for the new user’s password.');
      return;
    }
    setSaving(true);
    try {
      await createAdminUser({ email: email.trim(), password, role });
      setSuccess('The new staff member was created. Tell them their email and password using a safe method.');
      setEmail('');
      setPassword('');
      setRole('EDITOR');
      await load();
      setTimeout(() => setSuccess(''), 6000);
    } catch (err) {
      setError(err?.message || 'Could not create this user. The server may show a more specific reason above.');
    } finally {
      setSaving(false);
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    const id = staffRowId(deleteTarget);
    if (!id) return;
    setDeleteBusy(true);
    setError('');
    try {
      await deleteStaffUser(id);
      setSuccess('That staff member was removed.');
      setDeleteTarget(null);
      await load();
      setTimeout(() => setSuccess(''), 5000);
    } catch (err) {
      setError(err?.message || 'Could not remove this user.');
    } finally {
      setDeleteBusy(false);
    }
  }

  async function submitNewPassword(newPassword) {
    if (!pwTarget) return;
    const id = staffRowId(pwTarget);
    if (!id) return;
    setPwError('');
    setPwBusy(true);
    try {
      await updateStaffUserPassword(id, newPassword);
      setSuccess(`Password updated for ${staffEmail(pwTarget)}. They can sign in with the new password now.`);
      setPwTarget(null);
      await load();
      setTimeout(() => setSuccess(''), 6000);
    } catch (err) {
      setPwError(err?.message || 'Could not update the password.');
    } finally {
      setPwBusy(false);
    }
  }

  if (!session) {
    return <AdminLoader />;
  }

  if (!allowed) {
    return (
      <div>
        <h1 className="admin-page-title">Staff</h1>
        <p className="admin-muted">Only Admin or Super Admin accounts can open this page.</p>
        <Link href="/admin" className="admin-btn admin-btn--ghost" style={{ marginTop: '1rem' }}>
          Back to dashboard
        </Link>
      </div>
    );
  }

  if (loading && rows.length === 0) {
    return <AdminLoader />;
  }

  return (
    <div>
      <h1 className="admin-page-title">Staff accounts</h1>
      <p className="admin-muted" style={{ marginBottom: '1rem' }}>
        Add people who help run the site, reset their password if they forget it, or remove access when they leave.
      </p>

      <div className="admin-help-panel">
        <h2 className="admin-help-panel__title">How to use this page</h2>
        <ol className="admin-help-panel__list">
          <li>
            <strong>Add someone:</strong> Use their <em>work email</em>, pick a temporary password (at least 8 characters),
            and choose a role. Click <strong>Create staff member</strong>, then tell them the email and password
            privately (do not send passwords by public channels).
          </li>
          <li>
            <strong>Forgot password:</strong> Click <strong>Set new password</strong> next to their name, enter the new
            password twice, and save. They use it on the next login.
          </li>
          <li>
            <strong>Remove access:</strong> Click <strong>Remove</strong> when they should no longer sign in. If the
            button is missing, the server did not send a user id for that row — contact technical support.
          </li>
        </ol>
        <div className="admin-help-panel__roles">
          <strong>Roles (simple)</strong>
          <ul>
            <li>
              <code>ADMIN</code> — {roleLabels.ADMIN}
            </li>
            <li>
              <code>EDITOR</code> — {roleLabels.EDITOR}
            </li>
            <li>
              <code>SEO_EDITOR</code> — {roleLabels.SEO_EDITOR}
            </li>
          </ul>
        </div>
      </div>

      {success ? <div className="admin-flash admin-flash--success">{success}</div> : null}
      {error ? <div className="admin-flash admin-flash--error">{error}</div> : null}

      <div className="admin-card admin-card--section">
        <h2 className="admin-card__heading">Add a staff member</h2>
        <p className="admin-field-hint" style={{ marginTop: 0, marginBottom: '1rem' }}>
          The main “super admin” account from server settings is not shown in this table — only staff created here.
        </p>
        <form onSubmit={onCreate}>
          <div className="admin-form-grid">
            <div className="admin-field">
              <label htmlFor="staff-email">Work email (they will type this to log in)</label>
              <input
                id="staff-email"
                type="email"
                value={email}
                onChange={(ev) => setEmail(ev.target.value)}
                required
                autoComplete="off"
                placeholder="name@company.com"
              />
            </div>
            <div className="admin-field">
              <label htmlFor="staff-password">Starting password</label>
              <input
                id="staff-password"
                type="password"
                value={password}
                onChange={(ev) => setPassword(ev.target.value)}
                required
                autoComplete="new-password"
                minLength={8}
                placeholder="At least 8 characters"
              />
              <p className="admin-field-hint">They can change it later if your system supports it.</p>
            </div>
            <div className="admin-field">
              <label htmlFor="staff-role">What they are allowed to do</label>
              <select id="staff-role" value={role} onChange={(ev) => setRole(ev.target.value)}>
                {ROLES.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
              <p className="admin-field-hint">{roleLabels[role]}</p>
            </div>
          </div>
          <button type="submit" className="admin-btn admin-btn--primary" disabled={saving}>
            {saving ? 'Creating…' : 'Create staff member'}
          </button>
        </form>
      </div>

      <h2 className="admin-page-title admin-page-title--sub" style={{ marginTop: '2rem' }}>
        Current staff
      </h2>
      <p className="admin-muted" style={{ marginBottom: '0.75rem' }}>
        One row per person. Use the actions on the right to change a password or remove someone.
      </p>

      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Email</th>
              <th>Role</th>
              <th style={{ width: '240px' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={3} className="admin-muted">
                  No staff returned yet. If you expected people here, the list may be empty or the server format may
                  differ — check with technical support.
                </td>
              </tr>
            ) : (
              rows.map((row) => {
                const id = staffRowId(row);
                const em = staffEmail(row);
                const isSelf = sessionEmail && em && String(em).toLowerCase() === sessionEmail;
                const canAct = Boolean(id);

                return (
                  <tr key={id || em || JSON.stringify(row)}>
                    <td>
                      <div style={{ fontWeight: 600 }}>{em || '—'}</div>
                      {id ? (
                        <div className="admin-field-hint" style={{ marginTop: '0.25rem' }}>
                          User id: <code>{id}</code>
                        </div>
                      ) : (
                        <div className="admin-field-hint admin-field-hint--warn" style={{ marginTop: '0.25rem' }}>
                          No user id from server — password change and remove are unavailable.
                        </div>
                      )}
                    </td>
                    <td>
                      <code>{row.role ?? '—'}</code>
                    </td>
                    <td>
                      <div className="admin-row-actions">
                        <button
                          type="button"
                          className="admin-btn admin-btn--ghost admin-btn--sm"
                          disabled={!canAct}
                          onClick={() => {
                            setPwError('');
                            setPwTarget(row);
                          }}
                        >
                          Set new password
                        </button>
                        <button
                          type="button"
                          className="admin-btn admin-btn--danger admin-btn--sm"
                          disabled={!canAct || isSelf}
                          title={isSelf ? 'You cannot remove your own account from here.' : undefined}
                          onClick={() => setDeleteTarget(row)}
                        >
                          Remove
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <StaffPasswordModal
        open={Boolean(pwTarget)}
        staffEmail={pwTarget ? staffEmail(pwTarget) : ''}
        onClose={() => {
          if (!pwBusy) {
            setPwTarget(null);
            setPwError('');
          }
        }}
        onSubmit={submitNewPassword}
        busy={pwBusy}
        remoteError={pwError}
      />

      <ConfirmModal
        open={Boolean(deleteTarget)}
        title="Remove this staff member?"
        message={
          deleteTarget
            ? `They will no longer be able to sign in as ${staffEmail(deleteTarget)}. Only continue if this person should lose access.`
            : ''
        }
        confirmLabel="Remove access"
        danger
        busy={deleteBusy}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
      />
    </div>
  );
}
