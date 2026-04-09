'use client';

import { ImageUploadField } from '@/components/admin/ImageUploadField';

function moveItem(items, from, to) {
  const copy = [...items];
  const [item] = copy.splice(from, 1);
  copy.splice(to, 0, item);
  return copy;
}

export function ImageGalleryField({ label = 'Image gallery', value, onChange }) {
  const items = Array.isArray(value) ? value : [];

  function setItem(index, next) {
    const copy = [...items];
    copy[index] = next;
    onChange(copy);
  }

  function addItem() {
    onChange([...items, '']);
  }

  return (
    <div className="admin-field">
      <label>{label}</label>
      <div className="admin-list-field">
        {items.length === 0 ? <p className="admin-muted">No gallery images yet.</p> : null}
        {items.map((item, index) => (
          <div key={`img-${index}`} className="admin-gallery-item">
            <div className="admin-gallery-item__header">
              <strong>Image {index + 1}</strong>
              <div className="admin-list-item__actions">
                <button
                  type="button"
                  className="admin-btn admin-btn--ghost admin-btn--sm"
                  onClick={() => onChange(moveItem(items, index, index - 1))}
                  disabled={index === 0}
                >
                  Up
                </button>
                <button
                  type="button"
                  className="admin-btn admin-btn--ghost admin-btn--sm"
                  onClick={() => onChange(moveItem(items, index, index + 1))}
                  disabled={index === items.length - 1}
                >
                  Down
                </button>
                <button
                  type="button"
                  className="admin-btn admin-btn--danger admin-btn--sm"
                  onClick={() => onChange(items.filter((_, i) => i !== index))}
                >
                  Remove
                </button>
              </div>
            </div>
            <ImageUploadField
              label=""
              value={String(item || '')}
              onChange={(next) => setItem(index, next)}
              hint="Upload and keep the returned /uploads/ path."
            />
          </div>
        ))}
      </div>
      <button type="button" className="admin-btn admin-btn--ghost admin-btn--sm" onClick={addItem}>
        + Add gallery image
      </button>
    </div>
  );
}

