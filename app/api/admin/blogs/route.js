/**
 * BFF: GET/POST → {TEL_API_URL}/api/v1/admin/blogs
 * Do not send `slug` — server derives from title.
 */
import { getVerifiedAccessTokenPayload } from '@/lib/require-admin';
import { getTelApiBase } from '@/lib/tel-api';

export const runtime = 'nodejs';

function bodyWithoutSlug(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) return body;
  const { slug: _s, ...rest } = body;
  return rest;
}

export async function GET(request) {
  const auth = getVerifiedAccessTokenPayload();
  if (auth.error) return auth.error;

  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status');
  const q = searchParams.get('q');
  const limit = searchParams.get('limit');
  const offset = searchParams.get('offset');

  const qs = new URLSearchParams();
  if (status) qs.set('status', status);
  if (q) qs.set('q', q);
  if (limit) qs.set('limit', limit);
  if (offset) qs.set('offset', offset);

  const url = `${getTelApiBase()}/api/v1/admin/blogs${qs.toString() ? `?${qs.toString()}` : ''}`;
  const res = await fetch(url, {
    method: 'GET',
    headers: { Authorization: `Bearer ${auth.token}` },
    cache: 'no-store',
  });
  const data = await res.json().catch(() => ({}));
  return Response.json(data, { status: res.status });
}

export async function POST(request) {
  const auth = getVerifiedAccessTokenPayload();
  if (auth.error) return auth.error;

  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const url = `${getTelApiBase()}/api/v1/admin/blogs`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${auth.token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(bodyWithoutSlug(body)),
    cache: 'no-store',
  });
  const data = await res.json().catch(() => ({}));
  return Response.json(data, { status: res.status });
}

