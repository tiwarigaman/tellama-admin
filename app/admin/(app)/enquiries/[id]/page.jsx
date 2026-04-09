'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { getAdminEnquiry } from '@/lib/admin-api-client';
import { AdminLoader } from '@/components/admin/AdminLoader';

function fmtDate(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return String(iso);
  return d.toLocaleString();
}

async function copyToClipboard(text) {
  const s = String(text || '').trim();
  if (!s) return false;
  try {
    await navigator.clipboard.writeText(s);
    return true;
  } catch {
    return false;
  }
}

function FieldRow({ label, value, copy }) {
  const [copied, setCopied] = useState(false);
  const v = value == null || value === '' ? '—' : String(value);

  return (
    <div className="admin-kv">
      <div className="admin-kv__k">{label}</div>
      <div className="admin-kv__v">
        <span>{v}</span>
        {copy && v !== '—' ? (
          <button
            type="button"
            className="admin-btn admin-btn--ghost admin-btn--sm"
            onClick={async () => {
              const ok = await copyToClipboard(v);
              setCopied(ok);
              if (ok) setTimeout(() => setCopied(false), 1200);
            }}
            title="Copy"
          >
            {copied ? 'Copied' : 'Copy'}
          </button>
        ) : null}
      </div>
    </div>
  );
}

export default function EnquiryDetailPage() {
  const params = useParams();
  const id = params?.id != null ? String(params.id) : '';

  const [row, setRow] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError('');
    try {
      const res = await getAdminEnquiry(id);
      setRow(res?.data || null);
    } catch (e) {
      setError(e?.message || 'Failed to load enquiry');
      setRow(null);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading && !row) return <AdminLoader />;

  if (!row && error) {
    return (
      <div>
        <p className="admin-muted" style={{ marginBottom: '1rem' }}>
          <Link href="/admin/enquiries">← Enquiries</Link>
        </p>
        <div className="admin-flash admin-flash--error">{error}</div>
      </div>
    );
  }

  const isTour = row?.source === 'PACKAGE_PAGE';
  const pkgTitle = row?.package?.title || row?.package?.slug || null;

  return (
    <div>
      <p className="admin-muted" style={{ marginBottom: '1rem' }}>
        <Link href="/admin/enquiries">← Enquiries</Link>
      </p>

      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
        <h1 className="admin-page-title" style={{ margin: 0, flex: '1 1 auto' }}>
          Enquiry
        </h1>
        <span className="admin-badge">{isTour ? 'TOUR' : 'CONTACT'}</span>
      </div>

      {error ? <div className="admin-flash admin-flash--error">{error}</div> : null}

      <div className="admin-card" style={{ maxWidth: 980 }}>
        <div className="admin-form-section">
          <h2>Customer</h2>
          <FieldRow label="Name" value={row?.name} />
          <FieldRow label="Email" value={row?.email} copy />
          <FieldRow label="Phone" value={row?.phone} copy />
        </div>

        <div className="admin-form-section">
          <h2>Message</h2>
          <div className="admin-message-box">{row?.message ? String(row.message) : '—'}</div>
        </div>

        <div className="admin-form-section">
          <h2>Context</h2>
          <FieldRow label="Source" value={row?.source || '—'} />
          <FieldRow label="Created" value={fmtDate(row?.createdAt)} />
          <FieldRow label="Updated" value={fmtDate(row?.updatedAt)} />
          {row?.meta?.pageUrl ? (
            <div className="admin-kv">
              <div className="admin-kv__k">Page URL</div>
              <div className="admin-kv__v">
                <a href={String(row.meta.pageUrl)} target="_blank" rel="noreferrer">
                  {String(row.meta.pageUrl)}
                </a>
                <button
                  type="button"
                  className="admin-btn admin-btn--ghost admin-btn--sm"
                  onClick={() => copyToClipboard(String(row.meta.pageUrl))}
                >
                  Copy
                </button>
              </div>
            </div>
          ) : null}
          {isTour ? (
            <>
              <FieldRow label="Tour" value={pkgTitle || '—'} />
              {row?.package?.id ? (
                <div className="admin-kv">
                  <div className="admin-kv__k">Open tour</div>
                  <div className="admin-kv__v">
                    <Link
                      href={`/admin/packages/${encodeURIComponent(row.package.id)}/edit`}
                      className="admin-btn admin-btn--ghost admin-btn--sm"
                    >
                      Edit tour
                    </Link>
                  </div>
                </div>
              ) : null}
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}

