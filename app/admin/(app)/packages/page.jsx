'use client';

import Link from 'next/link';
import { Suspense, useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  deleteAdminPackage,
  getSessionRequest,
  listAdminCategories,
  listAdminPackages,
} from '@/lib/admin-api-client';
import { ConfirmModal } from '@/components/ConfirmModal';
import { AdminLoader } from '@/components/admin/AdminLoader';
import { sortCategories } from '@/lib/category-tree';
import { canCreateTelPackage, canDeleteTelPackage } from '@/lib/tel-access-payload';
import { absoluteTelUploadUrl } from '@/lib/tel-media-url';

function PackagesListInner() {
  const searchParams = useSearchParams();
  const [sessionRole, setSessionRole] = useState(null);
  const [categories, setCategories] = useState([]);
  const [packages, setPackages] = useState([]);
  const [filterCategoryId, setFilterCategoryId] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteBusy, setDeleteBusy] = useState(false);

  useEffect(() => {
    const q = searchParams.get('categoryId');
    if (q) setFilterCategoryId(q);
  }, [searchParams]);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [session, cats, pkgs] = await Promise.all([
        getSessionRequest(),
        listAdminCategories(),
        listAdminPackages(filterCategoryId || undefined),
      ]);
      setSessionRole(session?.role || null);
      setCategories(Array.isArray(cats?.data) ? cats.data : []);
      setPackages(Array.isArray(pkgs?.data) ? pkgs.data : []);
    } catch (e) {
      setError(e?.message || 'Failed to load tours');
      setPackages([]);
    } finally {
      setLoading(false);
    }
  }, [filterCategoryId]);

  useEffect(() => {
    load();
  }, [load]);

  async function confirmDelete() {
    if (!deleteTarget?.id) return;
    setDeleteBusy(true);
    setError('');
    try {
      await deleteAdminPackage(deleteTarget.id);
      setSuccess('Tour removed.');
      setDeleteTarget(null);
      await load();
      setTimeout(() => setSuccess(''), 4000);
    } catch (e) {
      setError(e?.message || 'Delete failed');
    } finally {
      setDeleteBusy(false);
    }
  }

  if (loading && packages.length === 0 && categories.length === 0) {
    return <AdminLoader />;
  }

  const canCreate = canCreateTelPackage(sessionRole);
  const canDel = canDeleteTelPackage(sessionRole);
  const sortedCats = sortCategories(categories);

  return (
    <div>
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
        <h1 className="admin-page-title" style={{ margin: 0, flex: '1 1 auto' }}>
          Tours
        </h1>
        {canCreate ? (
          <Link href="/admin/packages/new" className="admin-btn admin-btn--primary">
            New tour
          </Link>
        ) : null}
      </div>

      <p className="admin-muted" style={{ marginBottom: '1rem' }}>
        Each tour sits under a category (top-level or subcategory). The URL slug is generated from the title on the
        server — you do not set it here. Banner and gallery images use paths such as{' '}
        <code>/uploads/…</code> from your API.
      </p>

      <div className="admin-field" style={{ maxWidth: 420, marginBottom: '1.25rem' }}>
        <label htmlFor="pkg-filter-cat">Filter by category</label>
        <select
          id="pkg-filter-cat"
          value={filterCategoryId}
          onChange={(ev) => setFilterCategoryId(ev.target.value)}
        >
          <option value="">All categories</option>
          {sortedCats.map((c) => (
            <option key={c.id} value={c.id}>
              {c.parentId ? `↳ ${c.name}` : c.name}
            </option>
          ))}
        </select>
      </div>

      {success ? <div className="admin-flash admin-flash--success">{success}</div> : null}
      {error ? <div className="admin-flash admin-flash--error">{error}</div> : null}

      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Tour</th>
              <th>Category</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {packages.length === 0 ? (
              <tr>
                <td colSpan={3} className="admin-muted">
                  No tours in this view. {canCreate ? 'Add one with “New tour”.' : ''}
                </td>
              </tr>
            ) : (
              packages.map((p) => {
                const catName = p.category?.name || '—';
                const thumb = p.bannerImage ? absoluteTelUploadUrl(p.bannerImage) : '';
                return (
                  <tr key={p.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        {thumb ? (
                          <img
                            src={thumb}
                            alt=""
                            width={48}
                            height={48}
                            style={{
                              objectFit: 'cover',
                              borderRadius: 8,
                              border: '1px solid var(--admin-border)',
                              flexShrink: 0,
                            }}
                          />
                        ) : null}
                        <div>
                          <div style={{ fontWeight: 600 }}>{p.title || '—'}</div>
                          <div className="admin-muted" style={{ fontSize: '0.8rem' }}>
                            <code>{p.slug || '—'}</code>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td>{catName}</td>
                    <td>
                      <div className="admin-row-actions">
                        <Link
                          href={`/admin/packages/${encodeURIComponent(p.id)}/edit`}
                          className="admin-btn admin-btn--ghost admin-btn--sm"
                        >
                          Edit
                        </Link>
                        {canDel ? (
                          <button
                            type="button"
                            className="admin-btn admin-btn--danger admin-btn--sm"
                            onClick={() => setDeleteTarget(p)}
                          >
                            Delete
                          </button>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <ConfirmModal
        open={Boolean(deleteTarget)}
        title="Delete tour?"
        message={
          deleteTarget
            ? `Remove “${deleteTarget.title}”? The server will reject this if the tour is still referenced or your role cannot delete it.`
            : ''
        }
        confirmLabel="Delete"
        danger
        busy={deleteBusy}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
      />
    </div>
  );
}

export default function AdminPackagesPage() {
  return (
    <Suspense fallback={<AdminLoader />}>
      <PackagesListInner />
    </Suspense>
  );
}
