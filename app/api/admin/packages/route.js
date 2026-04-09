/**
 * BFF: GET/POST → {TEL_API_URL}/api/v1/admin/packages
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
  const categoryId = searchParams.get('categoryId');
  const q = categoryId ? `?categoryId=${encodeURIComponent(categoryId)}` : '';

  const url = `${getTelApiBase()}/api/v1/admin/packages${q}`;
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

  const url = `${getTelApiBase()}/api/v1/admin/packages`;
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
  if (!res.ok && res.status === 400 && process.env.NODE_ENV === 'development') {
    console.error('[BFF POST /api/admin/packages] upstream 400:', JSON.stringify(data, null, 2));
  }
  return Response.json(data, { status: res.status });
}
