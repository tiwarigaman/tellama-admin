'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { createAdminPackage, updateAdminPackage } from '@/lib/admin-api-client';
import {
  canCreateTelPackage,
  canEditTelPackageStructure,
  isTelPackageSeoOnlyRole,
} from '@/lib/tel-access-payload';
import { sortCategories } from '@/lib/category-tree';
import { ImageUploadField } from '@/components/admin/ImageUploadField';
import { RichTextEditor } from '@/components/admin/RichTextEditor';
import { StringListField } from '@/components/admin/StringListField';
import { FlaggedListField } from '@/components/admin/FlaggedListField';
import { ImageGalleryField } from '@/components/admin/ImageGalleryField';
import { ItineraryEditor } from '@/components/admin/ItineraryEditor';

function commaToArray(s) {
  return String(s || '')
    .split(/[,;\n]+/)
    .map((x) => x.trim())
    .filter(Boolean);
}

const EMPTY_DOC = { type: 'doc', content: [{ type: 'paragraph' }] };

function tipTapPlainText(doc) {
  if (!doc || typeof doc !== 'object') return '';
  function walk(n) {
    if (!n) return '';
    if (typeof n.text === 'string') return n.text;
    if (Array.isArray(n.content)) return n.content.map(walk).join('');
    return '';
  }
  return walk(doc);
}

function isEmptyTipTapDoc(doc) {
  return !tipTapPlainText(doc).trim();
}

/** List fields: API may return plain strings or TipTap one-line docs. */
function normalizeTextListForUi(v) {
  if (!Array.isArray(v)) return [];
  return v
    .map((x) => {
      if (typeof x === 'string') return x.trim();
      if (x && typeof x === 'object' && x.type === 'doc') return tipTapPlainText(x).trim();
      return String(x ?? '').trim();
    })
    .filter(Boolean);
}

function normalizeStringArray(v) {
  if (Array.isArray(v)) return v.map((x) => String(x ?? '').trim()).filter(Boolean);
  if (typeof v === 'string' && v.trim()) return [v.trim()];
  return [];
}

function normalizeOverview(v) {
  if (v && typeof v === 'object') return v;
  return EMPTY_DOC;
}

function normalizeItinerary(v) {
  if (!Array.isArray(v)) return [];
  return v.map((row) => ({
    title: typeof row?.title === 'string' ? row.title : '',
    content: row?.content && typeof row.content === 'object' ? row.content : EMPTY_DOC,
  }));
}

function textToDoc(text) {
  const t = String(text || '').trim();
  if (!t) return EMPTY_DOC;
  return {
    type: 'doc',
    content: [{ type: 'paragraph', content: [{ type: 'text', text: t }] }],
  };
}

export function PackageForm({ mode, packageId, categories, sessionRole, initialPackage, cancelHref, onSaved }) {
  const seoOnly = isTelPackageSeoOnlyRole(sessionRole);
  const canStructure = canEditTelPackageStructure(sessionRole);
  const canCreate = canCreateTelPackage(sessionRole);

  const sortedCats = sortCategories(Array.isArray(categories) ? categories : []);

  const [title, setTitle] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [shortDescription, setShortDescription] = useState('');
  const [location, setLocation] = useState('');
  const [cities, setCities] = useState('');
  const [duration, setDuration] = useState('');
  const [language, setLanguage] = useState('English');
  const [startPrice, setStartPrice] = useState('');
  const [bannerImage, setBannerImage] = useState('');
  const [tagsStr, setTagsStr] = useState('');
  const [seoTitle, setSeoTitle] = useState('');
  const [seoDescription, setSeoDescription] = useState('');
  const [seoKeywordsStr, setSeoKeywordsStr] = useState('');
  const [overview, setOverview] = useState(EMPTY_DOC);
  const [highlights, setHighlights] = useState([]);
  const [included, setIncluded] = useState([]);
  const [notIncluded, setNotIncluded] = useState([]);
  const [specialNotes, setSpecialNotes] = useState([]);
  const [itinerary, setItinerary] = useState([]);
  const [imageGallery, setImageGallery] = useState([]);

  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const submitLockRef = useRef(false);

  useEffect(() => {
    const p = initialPackage;
    if (!p) return;
    setTitle(p.title ?? '');
    setCategoryId(p.categoryId ?? p.category?.id ?? '');
    setShortDescription(p.shortDescription ?? '');
    setLocation(p.location ?? '');
    setCities(
      Array.isArray(p.cities) ? p.cities.join(', ') : p.cities != null ? String(p.cities) : '',
    );
    setDuration(p.duration ?? '');
    setLanguage(p.language ?? 'English');
    setStartPrice(p.startPrice != null && p.startPrice !== '' ? String(p.startPrice) : '');
    setBannerImage(p.bannerImage ?? '');
    setTagsStr(Array.isArray(p.tags) ? p.tags.join(', ') : p.tags ?? '');
    setSeoTitle(p.seoTitle ?? '');
    setSeoDescription(p.seoDescription ?? '');
    setSeoKeywordsStr(Array.isArray(p.seoKeywords) ? p.seoKeywords.join(', ') : p.seoKeywords ?? '');
    setOverview(normalizeOverview(p.overview));
    setHighlights(normalizeTextListForUi(p.highlights));
    setIncluded(normalizeTextListForUi(p.included));
    setNotIncluded(normalizeTextListForUi(p.notIncluded));
    setSpecialNotes(normalizeTextListForUi(p.specialNotes));
    setImageGallery(normalizeStringArray(p.imageGallery));
    setItinerary(normalizeItinerary(p.itinerary));
  }, [initialPackage]);

  async function onSubmit(e) {
    e.preventDefault();
    if (submitLockRef.current) return;
    submitLockRef.current = true;
    setError('');
    setSaving(true);
    try {
      if (seoOnly) {
        const seoKeywords = commaToArray(seoKeywordsStr);
        const patch = {
          seoTitle: seoTitle.trim() || null,
          seoDescription: seoDescription.trim() || null,
          seoKeywords,
        };
        if (!patch.seoTitle && !patch.seoDescription && seoKeywords.length === 0) {
          setError('Please fill at least one SEO field (title, description, or keywords).');
          return;
        }
        await updateAdminPackage(packageId, patch);
        onSaved?.();
        return;
      }

      if (!title.trim()) {
        setError('Tour title is required.');
        return;
      }
      if (!categoryId) {
        setError('Please choose a category (top-level or subcategory, e.g. a country under International).');
        return;
      }

      const tags = commaToArray(tagsStr);
      const seoKeywords = commaToArray(seoKeywordsStr);
      const priceNum = startPrice.trim() === '' ? undefined : Number(startPrice);
      const citiesArr = commaToArray(cities);
      const cleanItinerary = normalizeItinerary(itinerary)
        .filter((d) => d.title.trim() || !isEmptyTipTapDoc(d.content))
        .map((d) => ({
          title: d.title.trim(),
          content: isEmptyTipTapDoc(d.content) ? EMPTY_DOC : d.content,
        }));

      const highlightStrs = highlights.map((s) => String(s || '').trim()).filter(Boolean);
      const includedDocs = included.map((s) => String(s || '').trim()).filter(Boolean).map(textToDoc);
      const notIncludedDocs = notIncluded.map((s) => String(s || '').trim()).filter(Boolean).map(textToDoc);
      const specialNotesStrs = specialNotes.map((s) => String(s || '').trim()).filter(Boolean);
      const galleryClean = imageGallery.map((s) => String(s || '').trim()).filter(Boolean);

      const body = {
        title: title.trim(),
        categoryId,
        shortDescription: shortDescription.trim() || null,
        location: location.trim() || null,
        cities: citiesArr,
        duration: duration.trim() || null,
        language: language.trim() || null,
        bannerImage: bannerImage.trim() || null,
        tags: tags.length ? tags : undefined,
        seoTitle: seoTitle.trim() || null,
        seoDescription: seoDescription.trim() || null,
        seoKeywords: seoKeywords.length ? seoKeywords : undefined,
        startPrice: Number.isFinite(priceNum) ? priceNum : undefined,
        ...(isEmptyTipTapDoc(overview) ? {} : { overview }),
        highlights: highlightStrs,
        // Backend expects rich JSON for included / not included lines.
        included: includedDocs.length ? includedDocs : null,
        notIncluded: notIncludedDocs.length ? notIncludedDocs : null,
        specialNotes: specialNotesStrs,
        itinerary: cleanItinerary.length ? cleanItinerary : null,
        imageGallery: galleryClean,
      };

      Object.keys(body).forEach((k) => {
        if (body[k] === undefined) delete body[k];
      });

      if (mode === 'create') {
        const res = await createAdminPackage(body);
        const id = res?.data?.id;
        onSaved?.(id);
      } else {
        await updateAdminPackage(packageId, body);
        onSaved?.();
      }
    } catch (err) {
      setError(err?.message || 'Could not save. The server message may explain why.');
    } finally {
      setSaving(false);
      submitLockRef.current = false;
    }
  }

  if (mode === 'create' && !canCreate) {
    return (
      <p className="admin-muted">Your role cannot create tours. Ask an Admin if you need a new package.</p>
    );
  }

  if (!seoOnly && !canStructure) {
    return <p className="admin-muted">Your role cannot edit tour details.</p>;
  }

  const catLabel =
    initialPackage?.category?.name ||
    sortedCats.find((c) => c.id === categoryId)?.name ||
    '—';

  return (
    <form onSubmit={onSubmit} className="admin-card" style={{ maxWidth: 880 }}>
      {error ? <div className="admin-flash admin-flash--error">{error}</div> : null}

      {seoOnly ? (
        <div className="admin-help-panel" style={{ marginBottom: '1.25rem' }}>
          <p className="admin-help-panel__title" style={{ marginBottom: '0.5rem' }}>
            SEO-only editing
          </p>
          <p className="admin-muted" style={{ margin: 0, fontSize: '0.875rem', lineHeight: 1.5 }}>
            You can only change search-engine fields for this tour. Title: <strong>{title || '—'}</strong> · Category:{' '}
            <strong>{catLabel}</strong>
          </p>
        </div>
      ) : (
        <>
          <div className="admin-help-panel" style={{ marginBottom: '1.25rem' }}>
            <p className="admin-help-panel__title" style={{ marginBottom: '0.5rem' }}>
              Before you start
            </p>
            <ul className="admin-help-panel__list" style={{ marginBottom: 0 }}>
              <li>
                <strong>Category</strong> must be a real category from your site (including subcategories like a
                destination under International).
              </li>
              <li>
                The web address slug for the tour is <strong>created automatically</strong> from the title — do not try
                to set it here.
              </li>
              <li>
                For <strong>photos</strong>, upload an image or paste a path such as <code>/uploads/…</code> from your
                server.
              </li>
              <li>
                <strong>Advanced sections</strong> now use editor boxes, so you can add content without writing raw JSON.
              </li>
            </ul>
          </div>

          <div className="admin-form-section">
            <h2>Basics</h2>
            <div className="admin-field">
              <label htmlFor="pkg-title">Tour title *</label>
              <input id="pkg-title" value={title} onChange={(ev) => setTitle(ev.target.value)} required={!seoOnly} />
            </div>
            <div className="admin-field">
              <label htmlFor="pkg-category">Category *</label>
              <select id="pkg-category" value={categoryId} onChange={(ev) => setCategoryId(ev.target.value)} required={!seoOnly}>
                <option value="">— Choose category —</option>
                {sortedCats.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.parentId ? `↳ ${c.name}` : c.name} ({c.slug})
                  </option>
                ))}
              </select>
              <p className="admin-field-hint">Pick where this tour belongs in the catalogue (same list as Categories).</p>
            </div>
            <div className="admin-field">
              <label htmlFor="pkg-short">Short description</label>
              <textarea
                id="pkg-short"
                className="admin-code"
                rows={3}
                value={shortDescription}
                onChange={(ev) => setShortDescription(ev.target.value)}
              />
            </div>
          </div>

          <div className="admin-form-section">
            <h2>Trip details</h2>
            <div className="admin-form-grid">
              <div className="admin-field">
                <label htmlFor="pkg-loc">Location</label>
                <input id="pkg-loc" value={location} onChange={(ev) => setLocation(ev.target.value)} />
              </div>
              <div className="admin-field">
                <label htmlFor="pkg-cities">Cities</label>
                <input
                  id="pkg-cities"
                  value={cities}
                  onChange={(ev) => setCities(ev.target.value)}
                  placeholder="City A, City B"
                />
                <p className="admin-field-hint">Separate multiple cities with commas.</p>
              </div>
              <div className="admin-field">
                <label htmlFor="pkg-dur">Duration</label>
                <input id="pkg-dur" value={duration} onChange={(ev) => setDuration(ev.target.value)} placeholder="e.g. 7 days" />
              </div>
              <div className="admin-field">
                <label htmlFor="pkg-lang">Language</label>
                <input id="pkg-lang" value={language} onChange={(ev) => setLanguage(ev.target.value)} />
              </div>
              <div className="admin-field">
                <label htmlFor="pkg-price">Start price</label>
                <input
                  id="pkg-price"
                  type="number"
                  min={0}
                  step="0.01"
                  value={startPrice}
                  onChange={(ev) => setStartPrice(ev.target.value)}
                  placeholder="0"
                />
              </div>
            </div>
          </div>

          <div className="admin-form-section">
            <h2>Images</h2>
            <ImageUploadField
              label="Banner image"
              value={bannerImage}
              onChange={setBannerImage}
              hint="Main image for the tour. Upload a file or paste a /uploads/… path from the server."
            />
          </div>

          <div className="admin-form-section">
            <h2>Tags</h2>
            <div className="admin-field">
              <label htmlFor="pkg-tags">Tags</label>
              <input
                id="pkg-tags"
                value={tagsStr}
                onChange={(ev) => setTagsStr(ev.target.value)}
                placeholder="adventure, family, beach"
              />
              <p className="admin-field-hint">Separate with commas.</p>
            </div>
          </div>
        </>
      )}

      <div className="admin-form-section">
        <h2>SEO (search engines)</h2>
        <div className="admin-field">
          <label htmlFor="pkg-seo-title">SEO title</label>
          <input id="pkg-seo-title" value={seoTitle} onChange={(ev) => setSeoTitle(ev.target.value)} />
        </div>
        <div className="admin-field">
          <label htmlFor="pkg-seo-desc">SEO description</label>
          <textarea id="pkg-seo-desc" className="admin-code" rows={3} value={seoDescription} onChange={(ev) => setSeoDescription(ev.target.value)} />
        </div>
        <div className="admin-field">
          <label htmlFor="pkg-seo-kw">SEO keywords</label>
          <input
            id="pkg-seo-kw"
            value={seoKeywordsStr}
            onChange={(ev) => setSeoKeywordsStr(ev.target.value)}
            placeholder="keyword one, keyword two"
          />
          <p className="admin-field-hint">Separate with commas.</p>
        </div>
      </div>

      {!seoOnly ? (
        <div className="admin-form-section">
          <h2>Content</h2>
          <RichTextEditor
            label="Overview"
            value={overview}
            onChange={setOverview}
            placeholder="Write package overview"
          />
          <StringListField
            label="Highlights"
            value={highlights}
            onChange={setHighlights}
            placeholder="Add highlight"
            addLabel="Add highlight"
          />
          <FlaggedListField
            label="Included"
            type="included"
            value={included}
            onChange={setIncluded}
            placeholder="Add included item"
            addLabel="Add included item"
          />
          <FlaggedListField
            label="Not included"
            type="not"
            value={notIncluded}
            onChange={setNotIncluded}
            placeholder="Add not included item"
            addLabel="Add not included item"
          />
          <StringListField
            label="Special notes"
            value={specialNotes}
            onChange={setSpecialNotes}
            placeholder="Add note"
            addLabel="Add note"
          />
          <ItineraryEditor value={itinerary} onChange={setItinerary} />
          <ImageGalleryField value={imageGallery} onChange={setImageGallery} />
        </div>
      ) : null}

      <div className="admin-row-actions">
        <button type="submit" className="admin-btn admin-btn--primary" disabled={saving}>
          {saving ? 'Saving…' : mode === 'create' ? 'Create tour' : 'Save changes'}
        </button>
        <Link href={cancelHref} className="admin-btn admin-btn--ghost">
          Cancel
        </Link>
      </div>
    </form>
  );
}
