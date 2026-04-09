'use client';

import { RichTextEditor } from '@/components/admin/RichTextEditor';

const EMPTY_DOC = { type: 'doc', content: [{ type: 'paragraph' }] };

function moveItem(items, from, to) {
  const copy = [...items];
  const [item] = copy.splice(from, 1);
  copy.splice(to, 0, item);
  return copy;
}

export function ItineraryEditor({ value, onChange }) {
  const items = Array.isArray(value) ? value : [];

  function setItem(index, next) {
    const copy = [...items];
    copy[index] = next;
    onChange(copy);
  }

  function addDay() {
    onChange([...items, { title: '', content: EMPTY_DOC }]);
  }

  return (
    <div className="admin-field">
      <label>Itinerary</label>
      <div className="admin-list-field">
        {items.length === 0 ? <p className="admin-muted">No day items yet.</p> : null}
        {items.map((row, index) => (
          <div key={`day-${index}`} className="admin-itinerary-item">
            <div className="admin-gallery-item__header">
              <strong>Day {index + 1}</strong>
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
            <div className="admin-field">
              <label>Title</label>
              <input
                value={String(row?.title || '')}
                placeholder="Day title"
                onChange={(ev) => setItem(index, { ...row, title: ev.target.value })}
              />
            </div>
            <RichTextEditor
              label="Content"
              value={row?.content && typeof row.content === 'object' ? row.content : EMPTY_DOC}
              onChange={(next) => setItem(index, { ...row, content: next })}
              placeholder="Write day details"
            />
          </div>
        ))}
      </div>
      <button type="button" className="admin-btn admin-btn--ghost admin-btn--sm" onClick={addDay}>
        + Add day
      </button>
    </div>
  );
}

