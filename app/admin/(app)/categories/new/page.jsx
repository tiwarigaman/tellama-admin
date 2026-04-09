'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { createAdminCategory, getSessionRequest, listAdminCategories } from '@/lib/admin-api-client';
import { AdminLoader } from '@/components/admin/AdminLoader';
import { ImageUploadField } from '@/components/admin/ImageUploadField';
import { canCreateTelCategory, canSetAllowsSubcategories } from '@/lib/tel-access-payload';

export default function NewCategoryPage() {
  const router = useRouter();
  const [sessionRole, setSessionRole] = useState(null);
  const [flat, setFlat] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [name, setName] = useState('');
  const [sortOrder, setSortOrder] = useState('0');
  const [parentId, setParentId] = useState('');
  const [featureImage, setFeatureImage] = useState('');
  const [seoTitle, setSeoTitle] = useState('');
  const [seoDescription, setSeoDescription] = useState('');
  const [seoKeywords, setSeoKeywords] = useState('');
  const [allowsSubcategories, setAllowsSubcategories] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [session, data] = await Promise.all([
          getSessionRequest(),
          listAdminCategories(),
        ]);
        if (cancelled) return;
        const role = session?.role || null;
        setSessionRole(role);
        if (role === 'SEO_EDITOR') {
          router.replace('/admin/categories');
          return;
        }
        setFlat(Array.isArray(data?.data) ? data.data : []);
      } catch (e) {
        if (!cancelled) setError(e?.message || 'Failed to load');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [router]);

  const parentOptions = useMemo(
    () => flat.filter((c) => c.allowsSubcategories === true),
    [flat],
  );

  const isTopLevel = !parentId;
  const showAllows = isTopLevel && canSetAllowsSubcategories(sessionRole);

  async function onSubmit(e) {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      const body = {
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
      const res = await createAdminCategory(body);
      const created = res?.data;
      if (created?.id) {
        router.push(`/admin/categories/${encodeURIComponent(created.id)}/edit`);
        router.refresh();
        return;
      }
      router.push('/admin/categories');
      router.refresh();
    } catch (err) {
      setError(err?.message || 'Create failed');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <AdminLoader />;
  }

  if (!canCreateTelCategory(sessionRole)) {
    return (
      <div>
        <h1 className="admin-page-title">New category</h1>
        <p className="admin-muted">Your role cannot create categories.</p>
        <Link href="/admin/categories" className="admin-btn admin-btn--ghost" style={{ marginTop: '1rem' }}>
          Back
        </Link>
      </div>
    );
  }

  return (
    <div>
      <p className="admin-muted" style={{ marginBottom: '1rem' }}>
        <Link href="/admin/categories">← Categories</Link>
      </p>
      <h1 className="admin-page-title">New category</h1>
      <p className="admin-muted" style={{ marginBottom: '1.25rem' }}>
        Do not enter a slug — the API generates it from the name and optional parent.
      </p>

      {error ? <div className="admin-flash admin-flash--error">{error}</div> : null}

      <form onSubmit={onSubmit} className="admin-card" style={{ maxWidth: 720 }}>
        <div className="admin-form-section">
          <h2>Basics</h2>
          <div className="admin-field">
            <label htmlFor="name">Name *</label>
            <input
              id="name"
              value={name}
              onChange={(ev) => setName(ev.target.value)}
              required
              autoComplete="off"
            />
          </div>
          <div className="admin-field">
            <label htmlFor="sortOrder">Sort order</label>
            <input
              id="sortOrder"
              type="number"
              value={sortOrder}
              onChange={(ev) => setSortOrder(ev.target.value)}
            />
          </div>
          <div className="admin-field">
            <label htmlFor="parentId">Parent (subcategory)</label>
            <select id="parentId" value={parentId} onChange={(ev) => setParentId(ev.target.value)}>
              <option value="">Top-level category</option>
              {parentOptions.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.slug})
                </option>
              ))}
            </select>
            <p className="admin-muted" style={{ marginTop: '0.35rem', marginBottom: 0 }}>
              Only parents with “allows subcategories” appear here.
            </p>
          </div>
          {showAllows ? (
            <div className="admin-field">
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={allowsSubcategories}
                  onChange={(ev) => setAllowsSubcategories(ev.target.checked)}
                />
                Allow subcategories (top-level only, admin roles)
              </label>
            </div>
          ) : null}
          <ImageUploadField
            label="Feature image"
            value={featureImage}
            onChange={setFeatureImage}
            hint="Upload a category image or paste a /uploads/... path."
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

        <div className="admin-row-actions">
          <button type="submit" className="admin-btn admin-btn--primary" disabled={saving}>
            {saving ? <span className="admin-spinner" aria-label="Loading" /> : null}
            {saving ? ' Creating…' : 'Create'}
          </button>
          <Link href="/admin/categories" className="admin-btn admin-btn--ghost">
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
