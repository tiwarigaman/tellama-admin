'use client';

import Link from 'next/link';
import { Suspense, useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { ConfirmModal } from '@/components/ConfirmModal';
import { AdminLoader } from '@/components/admin/AdminLoader';
import { deleteAdminBlog, getSessionRequest, listAdminBlogs } from '@/lib/admin-api-client';
import { canCreateTelBlog, canDeleteTelBlog } from '@/lib/tel-access-payload';
import { absoluteTelUploadUrl } from '@/lib/tel-media-url';

function BlogsInner() {
  const searchParams = useSearchParams();
  const [sessionRole, setSessionRole] = useState(null);
  const [rows, setRows] = useState([]);
  const [status, setStatus] = useState('');
  const [q, setQ] = useState('');
  const [limit, setLimit] = useState(50);
  const [offset, setOffset] = useState(0);
  const [meta, setMeta] = useState({ total: 0, limit: 50, offset: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteBusy, setDeleteBusy] = useState(false);

  useEffect(() => {
    const st = searchParams.get('status');
    const qq = searchParams.get('q');
    if (st) setStatus(st);
    if (qq) setQ(qq);
  }, [searchParams]);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [session, data] = await Promise.all([
        getSessionRequest(),
        listAdminBlogs({ status: status || undefined, q: q || undefined, limit, offset }),
      ]);
      setSessionRole(session?.role || null);
      setRows(Array.isArray(data?.data) ? data.data : []);
      setMeta(data?.meta || { total: 0, limit, offset });
    } catch (e) {
      setError(e?.message || 'Failed to load blogs');
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [status, q, limit, offset]);

  useEffect(() => {
    load();
  }, [load]);

  async function confirmDelete() {
    if (!deleteTarget?.slug) return;
    setDeleteBusy(true);
    setError('');
    try {
      await deleteAdminBlog(deleteTarget.slug);
      setSuccess('Blog deleted.');
      setDeleteTarget(null);
      await load();
      setTimeout(() => setSuccess(''), 3000);
    } catch (e) {
      setError(e?.message || 'Delete failed');
    } finally {
      setDeleteBusy(false);
    }
  }

  if (loading && rows.length === 0) return <AdminLoader />;

  const canCreate = canCreateTelBlog(sessionRole);
  const canDel = canDeleteTelBlog(sessionRole);
  const total = Number(meta?.total || 0);

  return (
    <div>
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
        <h1 className="admin-page-title" style={{ margin: 0, flex: '1 1 auto' }}>Blogs</h1>
        {canCreate ? <Link href="/admin/blogs/new" className="admin-btn admin-btn--primary">New blog</Link> : null}
      </div>

      <div className="admin-card" style={{ maxWidth: 980, marginBottom: '1rem' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', alignItems: 'end' }}>
          <div className="admin-field" style={{ marginBottom: 0, minWidth: 180 }}>
            <label>Status</label>
            <select value={status} onChange={(ev) => { setStatus(ev.target.value); setOffset(0); }}>
              <option value="">All</option>
              <option value="PUBLISHED">Published</option>
              <option value="DRAFT">Draft</option>
              <option value="PENDING">Pending</option>
            </select>
          </div>
          <div className="admin-field" style={{ marginBottom: 0, minWidth: 280, flex: '1 1 auto' }}>
            <label>Search</label>
            <input value={q} onChange={(ev) => { setQ(ev.target.value); setOffset(0); }} placeholder="title, author, SEO title" />
          </div>
          <div className="admin-field" style={{ marginBottom: 0, minWidth: 120 }}>
            <label>Per page</label>
            <select value={limit} onChange={(ev) => { setLimit(Number(ev.target.value) || 50); setOffset(0); }}>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>
        </div>
      </div>

      {success ? <div className="admin-flash admin-flash--success">{success}</div> : null}
      {error ? <div className="admin-flash admin-flash--error">{error}</div> : null}

      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Blog</th>
              <th>Status</th>
              <th>Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr><td colSpan={4} className="admin-muted">No blogs found.</td></tr>
            ) : rows.map((b) => {
              const thumb = b.coverImage ? absoluteTelUploadUrl(b.coverImage) : '';
              return (
                <tr key={b.slug || b.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      {thumb ? <img src={thumb} alt="" width={48} height={48} style={{ objectFit: 'cover', borderRadius: 8, border: '1px solid var(--admin-border)' }} /> : null}
                      <div>
                        <div style={{ fontWeight: 600 }}>{b.title || '—'}</div>
                        <div className="admin-muted" style={{ fontSize: '0.8rem' }}><code>{b.slug || '—'}</code></div>
                      </div>
                    </div>
                  </td>
                  <td>{b.status || '—'}</td>
                  <td>{b.date ? String(b.date).slice(0, 10) : '—'}</td>
                  <td>
                    <div className="admin-row-actions">
                      <Link href={`/admin/blogs/${encodeURIComponent(b.slug)}/edit`} className="admin-btn admin-btn--ghost admin-btn--sm">Edit</Link>
                      {canDel ? <button type="button" className="admin-btn admin-btn--danger admin-btn--sm" onClick={() => setDeleteTarget(b)}>Delete</button> : null}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', marginTop: '1rem' }}>
        <button type="button" className="admin-btn admin-btn--ghost" disabled={offset <= 0 || loading} onClick={() => setOffset(Math.max(0, offset - limit))}>Prev</button>
        <button type="button" className="admin-btn admin-btn--ghost" disabled={offset + limit >= total || loading} onClick={() => setOffset(offset + limit)}>Next</button>
        <span className="admin-muted" style={{ fontSize: '0.875rem' }}>
          Showing {Math.min(total, offset + 1)}–{Math.min(total, offset + rows.length)} of {total}
        </span>
      </div>

      <ConfirmModal
        open={Boolean(deleteTarget)}
        title="Delete blog?"
        message={deleteTarget ? `Remove “${deleteTarget.title}”?` : ''}
        confirmLabel="Delete"
        danger
        busy={deleteBusy}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
      />
    </div>
  );
}

export default function AdminBlogsPage() {
  return (
    <Suspense fallback={<AdminLoader />}>
      <BlogsInner />
    </Suspense>
  );
}

