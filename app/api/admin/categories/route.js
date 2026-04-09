/**
 * BFF for tel-backend admin categories — no database here.
 * Upstream: GET/POST {TEL_API_URL}/api/v1/admin/categories (Bearer access token).
 * Clients must not send `slug`; it is stripped if present.
 */
import { getVerifiedAccessTokenPayload } from '@/lib/require-admin';
import { getTelApiBase } from '@/lib/tel-api';

export const runtime = 'nodejs';

function bodyWithoutSlug(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) return body;
  const { slug: _ignored, ...rest } = body;
  return rest;
}

async function forwardJson(method, url, token, body) {
  const init = {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      ...(body != null ? { 'Content-Type': 'application/json' } : {}),
    },
    cache: 'no-store',
    ...(body != null ? { body: JSON.stringify(body) } : {}),
  };
  return fetch(url, init);
}

export async function GET() {
  const auth = getVerifiedAccessTokenPayload();
  if (auth.error) return auth.error;

  const url = `${getTelApiBase()}/api/v1/admin/categories`;
  const res = await forwardJson('GET', url, auth.token);
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

  const url = `${getTelApiBase()}/api/v1/admin/categories`;
  const res = await forwardJson('POST', url, auth.token, bodyWithoutSlug(body));
  const data = await res.json().catch(() => ({}));
  return Response.json(data, { status: res.status });
}
