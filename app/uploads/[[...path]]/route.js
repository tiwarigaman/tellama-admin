/**
 * Proxy GET /uploads/* → `${TEL_API_URL}/uploads/*`
 *
 * Stored image paths are portable (`/uploads/...`). The browser always requests
 * the admin origin first; without this route, that hits Next.js and returns 404.
 * Optional: still set NEXT_PUBLIC_TEL_API_URL so <img> can load the API directly.
 */
import { getTelApiBase } from '@/lib/tel-api';

export const runtime = 'nodejs';

export async function GET(request, { params }) {
  const raw = params?.path;
  const segments = Array.isArray(raw) ? raw : raw != null ? [String(raw)] : [];
  if (segments.length === 0) {
    return new Response('Not found', { status: 404 });
  }
  if (segments.some((s) => s === '..' || String(s).includes('..'))) {
    return new Response('Bad request', { status: 400 });
  }

  const relPath = segments.map((s) => encodeURIComponent(String(s))).join('/');
  const { search } = new URL(request.url);
  const upstream = `${getTelApiBase()}/uploads/${relPath}${search}`;

  let res;
  try {
    res = await fetch(upstream, { method: 'GET', cache: 'no-store' });
  } catch {
    return new Response('Bad gateway', { status: 502 });
  }

  if (!res.ok) {
    const t = await res.text();
    return new Response(t || 'Not found', { status: res.status });
  }

  const headers = new Headers();
  const ct = res.headers.get('content-type');
  if (ct) headers.set('Content-Type', ct);
  const len = res.headers.get('content-length');
  if (len) headers.set('Content-Length', len);
  headers.set('Cache-Control', 'public, max-age=86400');

  return new Response(res.body, { status: 200, headers });
}
