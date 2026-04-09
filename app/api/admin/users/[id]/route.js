/**
 * BFF for tel-backend staff user by id.
 * Upstream: PATCH/DELETE {TEL_API_URL}/api/v1/admin/users/:id
 * PATCH body: typically { password: "..." } to set a new sign-in password (same field as POST create).
 */
import { getVerifiedAccessTokenPayload } from '@/lib/require-admin';
import { getTelApiBase } from '@/lib/tel-api';

export const runtime = 'nodejs';

export async function PATCH(request, { params }) {
  const auth = getVerifiedAccessTokenPayload();
  if (auth.error) return auth.error;

  const id = params?.id;
  if (!id || typeof id !== 'string') {
    return Response.json({ error: 'Missing user id' }, { status: 400 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const url = `${getTelApiBase()}/api/v1/admin/users/${encodeURIComponent(id)}`;
  const res = await fetch(url, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${auth.token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
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
    return Response.json({ error: 'Missing user id' }, { status: 400 });
  }

  const url = `${getTelApiBase()}/api/v1/admin/users/${encodeURIComponent(id)}`;
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
