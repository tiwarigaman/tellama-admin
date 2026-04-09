'use client';

function moveItem(items, from, to) {
  const copy = [...items];
  const [item] = copy.splice(from, 1);
  copy.splice(to, 0, item);
  return copy;
}

export function StringListField({
  label,
  value,
  onChange,
  placeholder = 'Type value',
  addLabel = 'Add item',
  marker = null,
}) {
  const items = Array.isArray(value) ? value : [];

  function setItem(index, next) {
    const copy = [...items];
    copy[index] = next;
    onChange(copy);
  }

  function addItem() {
    onChange([...items, '']);
  }

  function removeItem(index) {
    onChange(items.filter((_, i) => i !== index));
  }

  return (
    <div className="admin-field">
      <label>{label}</label>
      <div className="admin-list-field">
        {items.length === 0 ? <p className="admin-muted">No items yet.</p> : null}
        {items.map((item, index) => (
          <div key={`${label}-${index}`} className="admin-list-item">
            <div className="admin-list-item__left">
              {marker ? <span className="admin-list-item__marker">{marker}</span> : null}
              <input
                value={String(item ?? '')}
                placeholder={placeholder}
                onChange={(ev) => setItem(index, ev.target.value)}
              />
            </div>
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
                onClick={() => removeItem(index)}
              >
                Remove
              </button>
            </div>
          </div>
        ))}
      </div>
      <button type="button" className="admin-btn admin-btn--ghost admin-btn--sm" onClick={addItem}>
        + {addLabel}
      </button>
    </div>
  );
}

