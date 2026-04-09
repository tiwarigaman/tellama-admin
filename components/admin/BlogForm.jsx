'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { createAdminBlog, updateAdminBlog } from '@/lib/admin-api-client';
import {
  canCreateTelBlog,
  canEditTelBlogStructure,
  isTelBlogSeoOnlyRole,
} from '@/lib/tel-access-payload';
import { ImageUploadField } from '@/components/admin/ImageUploadField';
import { ImageGalleryField } from '@/components/admin/ImageGalleryField';
import { RichTextEditor } from '@/components/admin/RichTextEditor';

const EMPTY_DOC = { type: 'doc', content: [{ type: 'paragraph' }] };

function commaToArray(s) {
  return String(s || '')
    .split(/[,;\n]+/)
    .map((x) => x.trim())
    .filter(Boolean);
}

function normalizeContent(content) {
  if (!Array.isArray(content)) return [];
  return content.map((b) => ({
    heading: typeof b?.heading === 'string' ? b.heading : '',
    body: b?.body && typeof b.body === 'object' ? b.body : EMPTY_DOC,
  }));
}

function move(items, from, to) {
  const copy = [...items];
  const [it] = copy.splice(from, 1);
  copy.splice(to, 0, it);
  return copy;
}

export function BlogForm({ mode, blogSlug, initialBlog, sessionRole, cancelHref, onSaved }) {
  const seoOnly = isTelBlogSeoOnlyRole(sessionRole);
  const canStructure = canEditTelBlogStructure(sessionRole);
  const canCreate = canCreateTelBlog(sessionRole);

  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [status, setStatus] = useState('DRAFT');
  const [coverImage, setCoverImage] = useState('');
  const [galleryImages, setGalleryImages] = useState([]);
  const [tagsStr, setTagsStr] = useState('');
  const [seoTitle, setSeoTitle] = useState('');
  const [seoDescription, setSeoDescription] = useState('');
  const [seoKeywords, setSeoKeywords] = useState('');
  const [contentBlocks, setContentBlocks] = useState([]);

  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const b = initialBlog;
    if (!b) return;
    setTitle(b.title || '');
    setDate(b.date ? String(b.date).slice(0, 10) : '');
    setStatus(b.status || 'DRAFT');
    setCoverImage(b.coverImage || '');
    setGalleryImages(Array.isArray(b.galleryImages) ? b.galleryImages.map((x) => String(x)) : []);
    setTagsStr(Array.isArray(b.tags) ? b.tags.join(', ') : b.tags || '');
    setSeoTitle(b.seoTitle || '');
    setSeoDescription(b.seoDescription || '');
    setSeoKeywords(Array.isArray(b.seoKeywords) ? b.seoKeywords.join(', ') : b.seoKeywords || '');
    setContentBlocks(normalizeContent(b.content));
  }, [initialBlog]);

  async function onSubmit(e) {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      if (seoOnly) {
        const patch = {
          seoTitle: seoTitle.trim() || null,
          seoDescription: seoDescription.trim() || null,
          seoKeywords: seoKeywords.trim() || null,
        };
        if (!patch.seoTitle && !patch.seoDescription && !patch.seoKeywords) {
          setError('Please fill at least one SEO field.');
          setSaving(false);
          return;
        }
        await updateAdminBlog(blogSlug, patch);
        onSaved?.();
        return;
      }

      if (!title.trim()) {
        setError('Title is required.');
        setSaving(false);
        return;
      }

      const payload = {
        title: title.trim(),
        date: date || null,
        status,
        coverImage: coverImage.trim() || null,
        galleryImages: galleryImages.length ? galleryImages : null,
        tags: commaToArray(tagsStr),
        seoTitle: seoTitle.trim() || null,
        seoDescription: seoDescription.trim() || null,
        seoKeywords: seoKeywords.trim() || null,
        content: contentBlocks
          .map((b) => ({
            heading: (b.heading || '').trim() || null,
            body: b.body && typeof b.body === 'object' ? b.body : EMPTY_DOC,
          }))
          .filter((b) => b.heading || b.body),
      };

      Object.keys(payload).forEach((k) => {
        if (payload[k] === undefined) delete payload[k];
      });

      if (mode === 'create') {
        const res = await createAdminBlog(payload);
        onSaved?.(res?.data?.slug || null);
      } else {
        const res = await updateAdminBlog(blogSlug, payload);
        onSaved?.(res?.data?.slug || null);
      }
    } catch (e2) {
      setError(e2?.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  }

  if (mode === 'create' && !canCreate) {
    return <p className="admin-muted">Your role cannot create blogs.</p>;
  }
  if (!seoOnly && !canStructure) {
    return <p className="admin-muted">Your role cannot edit blog details.</p>;
  }

  return (
    <form onSubmit={onSubmit} className="admin-card" style={{ maxWidth: 920 }}>
      {error ? <div className="admin-flash admin-flash--error">{error}</div> : null}

      {!seoOnly ? (
        <>
          <div className="admin-form-section">
            <h2>Basics</h2>
            <div className="admin-field">
              <label>Title *</label>
              <input value={title} onChange={(ev) => setTitle(ev.target.value)} required />
            </div>
            <div className="admin-form-grid">
              <div className="admin-field">
                <label>Date</label>
                <input type="date" value={date} onChange={(ev) => setDate(ev.target.value)} />
              </div>
              <div className="admin-field">
                <label>Status</label>
                <select value={status} onChange={(ev) => setStatus(ev.target.value)}>
                  <option value="DRAFT">Draft</option>
                  <option value="PENDING">Pending</option>
                  <option value="PUBLISHED">Published</option>
                </select>
              </div>
            </div>
            <div className="admin-field">
              <label>Tags</label>
              <input value={tagsStr} onChange={(ev) => setTagsStr(ev.target.value)} placeholder="travel, tips, blog" />
            </div>
          </div>

          <div className="admin-form-section">
            <h2>Images</h2>
            <ImageUploadField
              label="Feature image"
              value={coverImage}
              onChange={setCoverImage}
              hint="Upload feature image for blog card/header."
            />
            <ImageGalleryField label="Gallery images" value={galleryImages} onChange={setGalleryImages} />
          </div>
        </>
      ) : null}

      <div className="admin-form-section">
        <h2>SEO</h2>
        <div className="admin-field">
          <label>SEO title</label>
          <input value={seoTitle} onChange={(ev) => setSeoTitle(ev.target.value)} />
        </div>
        <div className="admin-field">
          <label>SEO description</label>
          <textarea className="admin-code" rows={3} value={seoDescription} onChange={(ev) => setSeoDescription(ev.target.value)} />
        </div>
        <div className="admin-field">
          <label>SEO keywords</label>
          <input value={seoKeywords} onChange={(ev) => setSeoKeywords(ev.target.value)} placeholder="comma separated" />
        </div>
      </div>

      {!seoOnly ? (
        <div className="admin-form-section">
          <h2>Content blocks</h2>
          <p className="admin-muted" style={{ marginTop: 0 }}>Add sections for this blog. Each section supports heading + rich text body.</p>
          <div className="admin-list-field">
            {contentBlocks.length === 0 ? <p className="admin-muted">No content blocks yet.</p> : null}
            {contentBlocks.map((b, idx) => (
              <div key={`block-${idx}`} className="admin-itinerary-item">
                <div className="admin-gallery-item__header">
                  <strong>Section {idx + 1}</strong>
                  <div className="admin-list-item__actions">
                    <button type="button" className="admin-btn admin-btn--ghost admin-btn--sm" disabled={idx === 0} onClick={() => setContentBlocks(move(contentBlocks, idx, idx - 1))}>Up</button>
                    <button type="button" className="admin-btn admin-btn--ghost admin-btn--sm" disabled={idx === contentBlocks.length - 1} onClick={() => setContentBlocks(move(contentBlocks, idx, idx + 1))}>Down</button>
                    <button type="button" className="admin-btn admin-btn--danger admin-btn--sm" onClick={() => setContentBlocks(contentBlocks.filter((_, i) => i !== idx))}>Remove</button>
                  </div>
                </div>
                <div className="admin-field">
                  <label>Heading</label>
                  <input
                    value={b.heading || ''}
                    onChange={(ev) => {
                      const copy = [...contentBlocks];
                      copy[idx] = { ...copy[idx], heading: ev.target.value };
                      setContentBlocks(copy);
                    }}
                  />
                </div>
                <RichTextEditor
                  label="Body"
                  value={b.body || EMPTY_DOC}
                  onChange={(next) => {
                    const copy = [...contentBlocks];
                    copy[idx] = { ...copy[idx], body: next };
                    setContentBlocks(copy);
                  }}
                  placeholder="Write blog section content"
                />
              </div>
            ))}
          </div>
          <button type="button" className="admin-btn admin-btn--ghost admin-btn--sm" onClick={() => setContentBlocks([...contentBlocks, { heading: '', body: EMPTY_DOC }])}>
            + Add section
          </button>
        </div>
      ) : null}

      <div className="admin-row-actions">
        <button type="submit" className="admin-btn admin-btn--primary" disabled={saving}>
          {saving ? 'Saving…' : mode === 'create' ? 'Create blog' : 'Save changes'}
        </button>
        <Link href={cancelHref} className="admin-btn admin-btn--ghost">Cancel</Link>
      </div>
    </form>
  );
}

