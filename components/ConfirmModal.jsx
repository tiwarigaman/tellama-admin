'use client';

export function ConfirmModal({ open, title, message, confirmLabel, danger, onConfirm, onCancel, busy }) {
  if (!open) return null;

  return (
    <div className="admin-modal-backdrop" role="presentation" onClick={busy ? undefined : onCancel}>
      <div
        className="admin-modal"
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
      >
        <h3>{title}</h3>
        <p>{message}</p>
        <div className="admin-modal-actions">
          <button type="button" className="admin-btn admin-btn--ghost" onClick={onCancel} disabled={busy}>
            Cancel
          </button>
          <button
            type="button"
            className={`admin-btn ${danger ? 'admin-btn--danger' : 'admin-btn--primary'}`}
            onClick={onConfirm}
            disabled={busy}
          >
            {busy ? <span className="admin-spinner" aria-hidden /> : null}
            {confirmLabel || 'Confirm'}
          </button>
        </div>
      </div>
    </div>
  );
}
