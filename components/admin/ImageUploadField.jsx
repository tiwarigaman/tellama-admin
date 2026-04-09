'use client';

import { useState } from 'react';
import { uploadAdminFile } from '@/lib/admin-api-client';
import { absoluteTelUploadUrl } from '@/lib/tel-media-url';

export function ImageUploadField({ label, value, onChange, hint, disabled = false }) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  async function onPick(ev) {
    const f = ev.target.files?.[0];
    if (!f) return;
    setBusy(true);
    setErr('');
    try {
      const data = await uploadAdminFile(f);
      const url = data?.url ?? data?.path;
      if (url) onChange(String(url));
      else setErr('Upload succeeded but no URL was returned.');
    } catch (e) {
      setErr(e?.message || 'Upload failed');
    } finally {
      setBusy(false);
      ev.target.value = '';
    }
  }

  const preview = value ? absoluteTelUploadUrl(value) : '';

  return (
    <div className="admin-field">
      <label>{label}</label>
      <input
        type="text"
        value={value}
        onChange={(ev) => onChange(ev.target.value)}
        placeholder="/uploads/your-image.png"
        autoComplete="off"
        disabled={disabled}
      />
      <p className="admin-field-hint" style={{ marginBottom: '0.5rem' }}>
        {hint ||
          'Paste a path from the server, or choose an image file (JPEG, PNG, WebP, GIF — about 8 MB max on the server).'}
      </p>
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '0.75rem' }}>
        <label className="admin-btn admin-btn--ghost" style={{ cursor: busy || disabled ? 'not-allowed' : 'pointer', margin: 0 }}>
          <input type="file" accept="image/jpeg,image/png,image/webp,image/gif" hidden onChange={onPick} disabled={busy || disabled} />
          {busy ? 'Uploading…' : 'Upload image'}
        </label>
        {preview ? (
          <a href={preview} target="_blank" rel="noreferrer" className="admin-muted" style={{ fontSize: '0.8125rem' }}>
            Open preview
          </a>
        ) : null}
      </div>
      {err ? <p className="admin-field-hint admin-field-hint--warn">{err}</p> : null}
      {preview ? (
        <div style={{ marginTop: '0.75rem' }}>
          <img
            src={preview}
            alt=""
            style={{ maxWidth: 'min(280px, 100%)', maxHeight: '160px', borderRadius: 8, border: '1px solid var(--admin-border)' }}
          />
        </div>
      ) : null}
    </div>
  );
}
