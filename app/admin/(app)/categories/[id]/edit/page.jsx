'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { getSessionRequest, listAdminCategories, updateAdminCategory } from '@/lib/admin-api-client';
import { AdminLoader } from '@/components/admin/AdminLoader';
import { ImageUploadField } from '@/components/admin/ImageUploadField';
import { categoriesByParent, categoryHasChildren } from '@/lib/category-tree';
import { canSetAllowsSubcategories, canEditTelCategoryStructure } from '@/lib/tel-access-payload';

export default function EditCategoryPage() {
  const params = useParams();
  const id = params?.id;

  const [sessionRole, setSessionRole] = useState(null);
  const [flat, setFlat] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [name, setName] = useState('');
  const [sortOrder, setSortOrder] = useState('0');
  const [parentId, setParentId] = useState('');
  const [featureImage, setFeatureImage] = useState('');
  const [seoTitle, setSeoTitle] = useState('');
  const [seoDescription, setSeoDescription] = useState('');
  const [seoKeywords, setSeoKeywords] = useState('');
  const [allowsSubcategories, setAllowsSubcategories] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [session, data] = await Promise.all([
        getSessionRequest(),
        listAdminCategories(),
      ]);
      setSessionRole(session?.role || null);
      const rows = Array.isArray(data?.data) ? data.data : [];
      setFlat(rows);
      const row = rows.find((c) => c.id === id);
      if (!row) {
        setError('Category not found.');
        return;
      }
      setName(row.name || '');
      setSortOrder(String(row.sortOrder ?? 0));
      setParentId(row.parentId || '');
      setFeatureImage(row.featureImage || '');
      setSeoTitle(row.seoTitle || '');
      setSeoDescription(row.seoDescription || '');
      setSeoKeywords(row.seoKeywords || '');
      setAllowsSubcategories(Boolean(row.allowsSubcategories));
    } catch (e) {
      setError(e?.message || 'Failed to load');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (!id) return;
    load();
  }, [id, load]);

  const byParent = useMemo(() => categoriesByParent(flat), [flat]);
  const row = useMemo(() => flat.find((c) => c.id === id), [flat, id]);
  const hasKids = id ? categoryHasChildren(id, byParent) : false;

  const parentOptions = useMemo(
    () => flat.filter((c) => c.allowsSubcategories === true && c.id !== id),
    [flat, id],
  );

  const isSeoOnly = sessionRole === 'SEO_EDITOR';
  const canStructure = canEditTelCategoryStructure(sessionRole);
  const isTopLevel = !parentId;
  const showAllows = isTopLevel && canSetAllowsSubcategories(sessionRole) && canStructure;

  async function onSubmit(e) {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSaving(true);
    try {
      let body;
      if (isSeoOnly) {
        body = {
          seoTitle: seoTitle.trim() || null,
          seoDescription: seoDescription.trim() || null,
          seoKeywords: seoKeywords.trim() || null,
        };
        if (!body.seoTitle && !body.seoDescription && !body.seoKeywords) {
          setError('Provide at least one SEO field.');
          setSaving(false);
          return;
        }
      } else {
        body = {
          name: name.trim(),
          sortOrder: Number(sortOrder) || 0,
          parentId: parentId || null,
          featureImage: featureImage.trim() || null,
          seoTitle: seoTitle.trim() || null,
          seoDescription: seoDescription.trim() || null,
          seoKeywords: seoKeywords.trim() || null,
        };
        if (showAllows) {
          body.allowsSubcategories = Boolean(allowsSubcategories);
        }
      }

      await updateAdminCategory(id, body);
      setSuccess('Saved.');
      await load();
      setTimeout(() => setSuccess(''), 3500);
    } catch (err) {
      setError(err?.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  }

  if (!id) {
    return <p className="admin-muted">Missing id.</p>;
  }

  if (loading) {
    return <AdminLoader />;
  }

  if (!row && error) {
    return (
      <div>
        <p className="admin-muted" style={{ marginBottom: '1rem' }}>
          <Link href="/admin/categories">← Categories</Link>
        </p>
        <div className="admin-flash admin-flash--error">{error}</div>
      </div>
    );
  }

  return (
    <div>
      <p className="admin-muted" style={{ marginBottom: '1rem' }}>
        <Link href="/admin/categories">← Categories</Link>
      </p>
      <h1 className="admin-page-title">Edit category</h1>
      <p className="admin-muted" style={{ marginBottom: '1rem' }}>
        Slug: <code>{row?.slug}</code> (read-only — updated when name or parent changes)
      </p>

      {success ? <div className="admin-flash admin-flash--success">{success}</div> : null}
      {error ? <div className="admin-flash admin-flash--error">{error}</div> : null}

      <form onSubmit={onSubmit} className="admin-card" style={{ maxWidth: 720 }}>
        {isSeoOnly ? (
          <div className="admin-form-section">
            <h2>SEO only</h2>
            <p className="admin-muted">Your role may only update SEO fields.</p>
            <div className="admin-field">
              <label htmlFor="seoTitle">SEO title</label>
              <input id="seoTitle" value={seoTitle} onChange={(ev) => setSeoTitle(ev.target.value)} />
            </div>
            <div className="admin-field">
              <label htmlFor="seoDescription">SEO description</label>
              <textarea
                id="seoDescription"
                className="admin-code"
                value={seoDescription}
                onChange={(ev) => setSeoDescription(ev.target.value)}
                rows={3}
              />
            </div>
            <div className="admin-field">
              <label htmlFor="seoKeywords">SEO keywords</label>
              <input id="seoKeywords" value={seoKeywords} onChange={(ev) => setSeoKeywords(ev.target.value)} />
            </div>
          </div>
        ) : (
          <>
            <div className="admin-form-section">
              <h2>Basics</h2>
              <div className="admin-field">
                <label htmlFor="name">Name *</label>
                <input
                  id="name"
                  value={name}
                  onChange={(ev) => setName(ev.target.value)}
                  required
                  disabled={!canStructure}
                />
              </div>
              <div className="admin-field">
                <label htmlFor="sortOrder">Sort order</label>
                <input
                  id="sortOrder"
                  type="number"
                  value={sortOrder}
                  onChange={(ev) => setSortOrder(ev.target.value)}
                  disabled={!canStructure}
                />
              </div>
              <div className="admin-field">
                <label htmlFor="parentId">Parent</label>
                <select
                  id="parentId"
                  value={parentId}
                  onChange={(ev) => setParentId(ev.target.value)}
                  disabled={!canStructure || hasKids}
                >
                  <option value="">Top-level category</option>
                  {parentOptions.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.slug})
                    </option>
                  ))}
                </select>
                {hasKids ? (
                  <p className="admin-muted" style={{ marginTop: '0.35rem', marginBottom: 0 }}>
                    Parent cannot change while this category has subcategories.
                  </p>
                ) : null}
              </div>
              {showAllows ? (
                <div className="admin-field">
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={allowsSubcategories}
                      onChange={(ev) => setAllowsSubcategories(ev.target.checked)}
                    />
                    Allow subcategories (top-level only)
                  </label>
                </div>
              ) : null}
              <ImageUploadField
                label="Feature image"
                value={featureImage}
                onChange={setFeatureImage}
                hint="Upload a category image or paste a /uploads/... path."
                disabled={!canStructure}
              />
            </div>

            <div className="admin-form-section">
              <h2>SEO</h2>
              <div className="admin-field">
                <label htmlFor="seoTitle">SEO title</label>
                <input id="seoTitle" value={seoTitle} onChange={(ev) => setSeoTitle(ev.target.value)} />
              </div>
              <div className="admin-field">
                <label htmlFor="seoDescription">SEO description</label>
                <textarea
                  id="seoDescription"
                  className="admin-code"
                  value={seoDescription}
                  onChange={(ev) => setSeoDescription(ev.target.value)}
                  rows={3}
                />
              </div>
              <div className="admin-field">
                <label htmlFor="seoKeywords">SEO keywords</label>
                <input id="seoKeywords" value={seoKeywords} onChange={(ev) => setSeoKeywords(ev.target.value)} />
              </div>
            </div>
          </>
        )}

        <div className="admin-row-actions">
          <button type="submit" className="admin-btn admin-btn--primary" disabled={saving}>
            {saving ? <span className="admin-spinner" aria-label="Loading" /> : null}
            {saving ? ' Saving…' : 'Save'}
          </button>
          <Link href="/admin/categories" className="admin-btn admin-btn--ghost">
            Back
          </Link>
        </div>
      </form>
    </div>
  );
}
