'use client';

import { useEffect, useState } from 'react';

/**
 * Simple modal for non-technical admins: set a new password with confirmation.
 */
export function StaffPasswordModal({ open, staffEmail, onClose, onSubmit, busy, remoteError }) {
  const [p1, setP1] = useState('');
  const [p2, setP2] = useState('');
  const [localErr, setLocalErr] = useState('');

  useEffect(() => {
    if (open) {
      setP1('');
      setP2('');
      setLocalErr('');
    }
  }, [open]);

  if (!open) return null;

  function handleFormSubmit(e) {
    e.preventDefault();
    setLocalErr('');
    if (p1.length < 8) {
      setLocalErr('Please use at least 8 characters for the new password.');
      return;
    }
    if (p1 !== p2) {
      setLocalErr('The two passwords do not match. Type the same password in both boxes.');
      return;
    }
    onSubmit(p1);
  }

  const showErr = localErr || remoteError;

  return (
    <div className="admin-modal-backdrop" role="presentation" onClick={busy ? undefined : onClose}>
      <div
        className="admin-modal admin-modal--form"
        role="dialog"
        aria-modal="true"
        aria-labelledby="staff-pw-title"
        onClick={(ev) => ev.stopPropagation()}
      >
        <h3 id="staff-pw-title">Set a new password</h3>
        <p className="admin-muted" style={{ marginTop: 0 }}>
          This updates the password for <strong>{staffEmail}</strong>. They will use the new password the next time they
          sign in at the admin login page.
        </p>

        {showErr ? <div className="admin-flash admin-flash--error">{showErr}</div> : null}

        <form onSubmit={handleFormSubmit}>
          <div className="admin-field">
            <label htmlFor="staff-pw-new">New password</label>
            <input
              id="staff-pw-new"
              type="password"
              value={p1}
              onChange={(ev) => setP1(ev.target.value)}
              autoComplete="new-password"
              required
              minLength={8}
            />
            <p className="admin-field-hint">At least 8 characters. Share it with the person securely (in person or a private message).</p>
          </div>
          <div className="admin-field">
            <label htmlFor="staff-pw-again">Type the new password again</label>
            <input
              id="staff-pw-again"
              type="password"
              value={p2}
              onChange={(ev) => setP2(ev.target.value)}
              autoComplete="new-password"
              required
              minLength={8}
            />
          </div>
          <div className="admin-modal-actions" style={{ marginTop: '1rem' }}>
            <button type="button" className="admin-btn admin-btn--ghost" onClick={onClose} disabled={busy}>
              Cancel
            </button>
            <button type="submit" className="admin-btn admin-btn--primary" disabled={busy}>
              {busy ? <span className="admin-spinner" aria-hidden /> : null}
              {busy ? ' Saving…' : 'Save new password'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
