/**
 * BFF for tel-backend category by id — no database here.
 * Upstream: PATCH/DELETE {TEL_API_URL}/api/v1/admin/categories/:id
 * PATCH body must not include `slug`; stripped if present.
 */
import { getVerifiedAccessTokenPayload } from '@/lib/require-admin';
import { getTelApiBase } from '@/lib/tel-api';

export const runtime = 'nodejs';

function bodyWithoutSlug(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) return body;
  const { slug: _ignored, ...rest } = body;
  return rest;
}

export async function PATCH(request, { params }) {
  const auth = getVerifiedAccessTokenPayload();
  if (auth.error) return auth.error;

  const id = params?.id;
  if (!id || typeof id !== 'string') {
    return Response.json({ error: 'Missing category id' }, { status: 400 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const url = `${getTelApiBase()}/api/v1/admin/categories/${encodeURIComponent(id)}`;
  const res = await fetch(url, {
    method: 'PATCH',
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

export async function DELETE(_request, { params }) {
  const auth = getVerifiedAccessTokenPayload();
  if (auth.error) return auth.error;

  const id = params?.id;
  if (!id || typeof id !== 'string') {
    return Response.json({ error: 'Missing category id' }, { status: 400 });
  }

  const url = `${getTelApiBase()}/api/v1/admin/categories/${encodeURIComponent(id)}`;
  const res = await fetch(url, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${auth.token}` },
    cache: 'no-store',
  });

  if (res.status === 204) {
    return new Response(null, { status: 204 });
  }

  const data = await res.json().catch(() => ({}));
  return Response.json(data, { status: res.status });
}
