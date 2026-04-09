/** @param {Array<{ sortOrder?: number, name?: string }>} items */
export function sortCategories(items) {
  return [...items].sort((a, b) => {
    const o = (Number(a.sortOrder) || 0) - (Number(b.sortOrder) || 0);
    if (o !== 0) return o;
    return String(a.name || '').localeCompare(String(b.name || ''));
  });
}

/**
 * @param {Array<{ id: string, parentId?: string | null }>} flat
 * @returns {Map<string, typeof flat>}
 */
export function categoriesByParent(flat) {
  const map = new Map();
  for (const c of flat) {
    const key = c.parentId || '';
    if (!map.has(key)) map.set(key, []);
    map.get(key).push(c);
  }
  for (const arr of map.values()) {
    sortCategories(arr);
  }
  return map;
}

/**
 * @param {string} id
 * @param {Map<string, Array<{ id: string, parentId?: string | null }>>} byParent
 */
export function categoryHasChildren(id, byParent) {
  const ch = byParent.get(id);
  return Array.isArray(ch) && ch.length > 0;
}
