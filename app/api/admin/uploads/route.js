/**
 * BFF: POST multipart (field `file`) / DELETE JSON { url } → /api/v1/admin/uploads
 */
import { getVerifiedAccessTokenPayload } from '@/lib/require-admin';
import { getTelApiBase } from '@/lib/tel-api';

export const runtime = 'nodejs';

export async function POST(request) {
  const auth = getVerifiedAccessTokenPayload();
  if (auth.error) return auth.error;

  let formData;
  try {
    formData = await request.formData();
  } catch {
    return Response.json({ error: 'Expected multipart form data' }, { status: 400 });
  }

  const file = formData.get('file');
  if (!file || typeof file === 'string') {
    return Response.json({ error: 'Missing file field' }, { status: 400 });
  }

  const forward = new FormData();
  forward.append('file', file);

  const url = `${getTelApiBase()}/api/v1/admin/uploads`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { Authorization: `Bearer ${auth.token}` },
    body: forward,
    cache: 'no-store',
  });

  const data = await res.json().catch(() => ({}));
  return Response.json(data, { status: res.status });
}

export async function DELETE(request) {
  const auth = getVerifiedAccessTokenPayload();
  if (auth.error) return auth.error;

  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const url = `${getTelApiBase()}/api/v1/admin/uploads`;
  const res = await fetch(url, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${auth.token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
    cache: 'no-store',
  });

  if (res.status === 204 || res.status === 404) {
    return new Response(null, { status: res.status });
  }

  const data = await res.json().catch(() => ({}));
  return Response.json(data, { status: res.status });
}
