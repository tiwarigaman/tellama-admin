'use client';

import Link from 'next/link';
import { Fragment, useCallback, useEffect, useState } from 'react';
import { deleteAdminCategory, getSessionRequest, listAdminCategories } from '@/lib/admin-api-client';
import { ConfirmModal } from '@/components/ConfirmModal';
import { AdminLoader } from '@/components/admin/AdminLoader';
import { categoriesByParent } from '@/lib/category-tree';
import { canCreateTelCategory, canDeleteTelCategory } from '@/lib/tel-access-payload';

function CategoryTableRows({ cats, depth, byParent, sessionRole, onAskDelete }) {
  const canDel = canDeleteTelCategory(sessionRole);

  return cats.map((cat) => {
    const slugPreview = cat.slug || '—';
    const subCount = (byParent.get(cat.id) || []).length;

    return (
      <Fragment key={cat.id}>
        <tr>
          <td style={{ paddingLeft: `${12 + depth * 18}px` }}>
            <div style={{ fontWeight: 600 }}>{cat.name || '—'}</div>
            <div className="admin-muted" style={{ fontSize: '0.8rem' }}>
              <code>{slugPreview}</code>
              {subCount ? (
                <span>
                  {' '}
                  · {subCount} sub{subCount === 1 ? '' : 's'}
                </span>
              ) : null}
            </div>
          </td>
          <td>{cat.sortOrder ?? 0}</td>
          <td>{!cat.parentId ? (cat.allowsSubcategories ? 'Yes' : 'No') : '—'}</td>
          <td>
            <div className="admin-row-actions">
              <Link
                href={`/admin/categories/${encodeURIComponent(cat.id)}/edit`}
                className="admin-btn admin-btn--ghost admin-btn--sm"
              >
                Edit
              </Link>
              {canDel ? (
                <button
                  type="button"
                  className="admin-btn admin-btn--danger admin-btn--sm"
                  onClick={() => onAskDelete(cat)}
                >
                  Delete
                </button>
              ) : null}
            </div>
          </td>
        </tr>
        <CategoryTableRows
          cats={byParent.get(cat.id) || []}
          depth={depth + 1}
          byParent={byParent}
          sessionRole={sessionRole}
          onAskDelete={onAskDelete}
        />
      </Fragment>
    );
  });
}

export default function AdminCategoriesPage() {
  const [flat, setFlat] = useState([]);
  const [sessionRole, setSessionRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteBusy, setDeleteBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [session, data] = await Promise.all([
        getSessionRequest(),
        listAdminCategories(),
      ]);
      setSessionRole(session?.role || null);
      setFlat(Array.isArray(data?.data) ? data.data : []);
    } catch (e) {
      setError(e?.message || 'Failed to load categories');
      setFlat([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const byParent = categoriesByParent(flat);
  const roots = byParent.get('') || [];

  async function confirmDelete() {
    if (!deleteTarget?.id) return;
    setDeleteBusy(true);
    setError('');
    try {
      await deleteAdminCategory(deleteTarget.id);
      setSuccess('Category deleted.');
      setDeleteTarget(null);
      await load();
      setTimeout(() => setSuccess(''), 4000);
    } catch (e) {
      setError(e?.message || 'Delete failed');
    } finally {
      setDeleteBusy(false);
    }
  }

  if (loading && flat.length === 0) {
    return <AdminLoader />;
  }

  const canCreate = canCreateTelCategory(sessionRole);

  return (
    <div>
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
        <h1 className="admin-page-title" style={{ margin: 0, flex: '1 1 auto' }}>
          Categories
        </h1>
        {canCreate ? (
          <Link href="/admin/categories/new" className="admin-btn admin-btn--primary">
            New category
          </Link>
        ) : null}
      </div>

      <p className="admin-muted" style={{ marginBottom: '1rem' }}>
        Slugs are generated on the server from the name (and parent). Use subcategories only under parents
        that allow them (for example International tours).
      </p>

      {success ? <div className="admin-flash admin-flash--success">{success}</div> : null}
      {error ? <div className="admin-flash admin-flash--error">{error}</div> : null}

      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Name / slug</th>
              <th>Sort</th>
              <th>Allows subs</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {roots.length === 0 ? (
              <tr>
                <td colSpan={4} className="admin-muted">
                  No categories yet.
                </td>
              </tr>
            ) : (
              <CategoryTableRows
                cats={roots}
                depth={0}
                byParent={byParent}
                sessionRole={sessionRole}
                onAskDelete={setDeleteTarget}
              />
            )}
          </tbody>
        </table>
      </div>

      <ConfirmModal
        open={Boolean(deleteTarget)}
        title="Delete category?"
        message={
          deleteTarget
            ? `Remove “${deleteTarget.name}”? This only succeeds if there are no subcategories and no packages linked.`
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
