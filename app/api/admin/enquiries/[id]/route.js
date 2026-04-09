/**
 * BFF: GET → {TEL_API_URL}/api/v1/admin/enquiries/:id
 */
import { getVerifiedAccessTokenPayload } from '@/lib/require-admin';
import { getTelApiBase } from '@/lib/tel-api';

export const runtime = 'nodejs';

export async function GET(_request, { params }) {
  const auth = getVerifiedAccessTokenPayload();
  if (auth.error) return auth.error;

  const id = params?.id ? String(params.id) : '';
  if (!id) return Response.json({ error: 'Missing id' }, { status: 400 });

  const url = `${getTelApiBase()}/api/v1/admin/enquiries/${encodeURIComponent(id)}`;
  const res = await fetch(url, {
    method: 'GET',
    headers: { Authorization: `Bearer ${auth.token}` },
    cache: 'no-store',
  });
  const data = await res.json().catch(() => ({}));
  return Response.json(data, { status: res.status });
}

