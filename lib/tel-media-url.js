/**
 * Build absolute URL for paths like `/uploads/...` returned by tel-backend.
 * Set `NEXT_PUBLIC_TEL_API_URL` or `NEXT_PUBLIC_API_URL` to the same origin as tel-backend
 * (e.g. https://api.indiatellama.com) so previews work in the browser.
 */
export function absoluteTelUploadUrl(path) {
  if (path == null || path === '') return '';
  const s = String(path);
  if (/^https?:\/\//i.test(s)) return s;
  const pub =
    typeof process !== 'undefined'
      ? process.env.NEXT_PUBLIC_TEL_API_URL || process.env.NEXT_PUBLIC_API_URL || ''
      : '';
  const base = String(pub).trim().replace(/\/$/, '');
  if (!base) return s.startsWith('/') ? s : `/${s}`;
  return `${base}${s.startsWith('/') ? '' : '/'}${s}`;
}
