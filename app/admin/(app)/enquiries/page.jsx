'use client';

import Link from 'next/link';
import { Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { listAdminEnquiries } from '@/lib/admin-api-client';
import { AdminLoader } from '@/components/admin/AdminLoader';

function fmtDate(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return String(iso);
  return d.toLocaleString();
}

function clampInt(v, fallback) {
  const n = Number(v);
  if (!Number.isFinite(n) || n < 0) return fallback;
  return Math.floor(n);
}

function EnquiriesInner() {
  const searchParams = useSearchParams();

  const [sourceTab, setSourceTab] = useState('PACKAGE_PAGE'); // PACKAGE_PAGE | CONTACT_PAGE
  const [q, setQ] = useState('');
  const [limit, setLimit] = useState(50);
  const [offset, setOffset] = useState(0);

  const [rows, setRows] = useState([]);
  const [meta, setMeta] = useState({ total: 0, limit: 50, offset: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const src = searchParams.get('source');
    const qp = searchParams.get('q');
    const lim = searchParams.get('limit');
    const off = searchParams.get('offset');
    if (src === 'CONTACT_PAGE' || src === 'PACKAGE_PAGE') setSourceTab(src);
    if (qp != null) setQ(qp);
    if (lim != null) setLimit(clampInt(lim, 50));
    if (off != null) setOffset(clampInt(off, 0));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await listAdminEnquiries({
        source: sourceTab,
        q: q.trim() || undefined,
        limit,
        offset,
      });
      setRows(Array.isArray(res?.data) ? res.data : []);
      setMeta(res?.meta || { total: 0, limit, offset });
    } catch (e) {
      setError(e?.message || 'Failed to load enquiries');
      setRows([]);
      setMeta({ total: 0, limit, offset });
    } finally {
      setLoading(false);
    }
  }, [sourceTab, q, limit, offset]);

  useEffect(() => {
    load();
  }, [load]);

  const total = Number(meta?.total) || 0;
  const canPrev = offset > 0;
  const canNext = offset + limit < total;

  const title = sourceTab === 'CONTACT_PAGE' ? 'Contact enquiries' : 'Tour enquiries';

  const tabs = useMemo(
    () => [
      { key: 'PACKAGE_PAGE', label: 'Tour enquiries' },
      { key: 'CONTACT_PAGE', label: 'Contact enquiries' },
    ],
    [],
  );

  function onSwitchTab(next) {
    setSourceTab(next);
    setOffset(0);
  }

  function onSubmitSearch(e) {
    e.preventDefault();
    setOffset(0);
    load();
  }

  return (
    <div>
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
        <h1 className="admin-page-title" style={{ margin: 0, flex: '1 1 auto' }}>
          Enquiries
        </h1>
      </div>

      <div className="admin-subtabs" style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
        {tabs.map((t) => (
          <button
            key={t.key}
            type="button"
            className={`admin-btn admin-btn--ghost${sourceTab === t.key ? ' admin-btn--active' : ''}`}
            onClick={() => onSwitchTab(t.key)}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="admin-card" style={{ maxWidth: 980, marginBottom: '1rem' }}>
        <div className="admin-form-section" style={{ borderBottom: 'none', paddingBottom: 0, marginBottom: 0 }}>
          <h2 style={{ marginBottom: '0.75rem' }}>{title}</h2>
          <form onSubmit={onSubmitSearch} style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', alignItems: 'end' }}>
            <div className="admin-field" style={{ flex: '1 1 320px', marginBottom: 0 }}>
              <label htmlFor="enq-q">Search</label>
              <input
                id="enq-q"
                value={q}
                onChange={(ev) => setQ(ev.target.value)}
                placeholder="Name, email, phone, message"
                autoComplete="off"
              />
            </div>
            <div className="admin-field" style={{ width: 160, marginBottom: 0 }}>
              <label htmlFor="enq-limit">Per page</label>
              <select id="enq-limit" value={limit} onChange={(ev) => setLimit(clampInt(ev.target.value, 50))}>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
                <option value={200}>200</option>
              </select>
            </div>
            <button type="submit" className="admin-btn admin-btn--primary" disabled={loading}>
              Search
            </button>
          </form>
        </div>
      </div>

      {error ? <div className="admin-flash admin-flash--error">{error}</div> : null}

      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>When</th>
              <th>Name</th>
              <th>Email</th>
              <th>Phone</th>
              <th>Message</th>
              <th>{sourceTab === 'PACKAGE_PAGE' ? 'Tour' : 'Source'}</th>
              <th>Open</th>
            </tr>
          </thead>
          <tbody>
            {loading && rows.length === 0 ? (
              <tr>
                <td colSpan={7} className="admin-muted">
                  Loading…
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={7} className="admin-muted">
                  No enquiries found.
                </td>
              </tr>
            ) : (
              rows.map((r) => {
                const pkgTitle = r?.package?.title || r?.package?.slug || '—';
                return (
                  <tr key={r.id}>
                    <td style={{ whiteSpace: 'nowrap' }}>{fmtDate(r.createdAt || r.updatedAt)}</td>
                    <td>{r.name || '—'}</td>
                    <td>{r.email || '—'}</td>
                    <td>{r.phone || '—'}</td>
                    <td className="admin-muted" style={{ maxWidth: 360 }}>
                      {r.message ? String(r.message).slice(0, 120) : '—'}
                      {r.message && String(r.message).length > 120 ? '…' : ''}
                    </td>
                    <td>{sourceTab === 'PACKAGE_PAGE' ? pkgTitle : r.source || '—'}</td>
                    <td>
                      <Link href={`/admin/enquiries/${encodeURIComponent(r.id)}`} className="admin-btn admin-btn--ghost admin-btn--sm">
                        View
                      </Link>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', marginTop: '1rem' }}>
        <button
          type="button"
          className="admin-btn admin-btn--ghost"
          onClick={() => setOffset(Math.max(0, offset - limit))}
          disabled={!canPrev || loading}
        >
          Prev
        </button>
        <button
          type="button"
          className="admin-btn admin-btn--ghost"
          onClick={() => setOffset(offset + limit)}
          disabled={!canNext || loading}
        >
          Next
        </button>
        <span className="admin-muted" style={{ fontSize: '0.875rem' }}>
          Showing {Math.min(total, offset + 1)}–{Math.min(total, offset + rows.length)} of {total}
        </span>
      </div>
    </div>
  );
}

export default function AdminEnquiriesPage() {
  return (
    <Suspense fallback={<AdminLoader />}>
      <EnquiriesInner />
    </Suspense>
  );
}

