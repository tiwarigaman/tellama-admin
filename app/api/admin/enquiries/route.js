/**
 * BFF: GET → {TEL_API_URL}/api/v1/admin/enquiries
 */
import { getVerifiedAccessTokenPayload } from '@/lib/require-admin';
import { getTelApiBase } from '@/lib/tel-api';
 
export const runtime = 'nodejs';
 
export async function GET(request) {
  const auth = getVerifiedAccessTokenPayload();
  if (auth.error) return auth.error;
 
  const { searchParams } = new URL(request.url);
  const source = searchParams.get('source');
  const packageId = searchParams.get('packageId');
  const q = searchParams.get('q');
  const limit = searchParams.get('limit');
  const offset = searchParams.get('offset');
 
  const qs = new URLSearchParams();
  if (source) qs.set('source', source);
  if (packageId) qs.set('packageId', packageId);
  if (q) qs.set('q', q);
  if (limit) qs.set('limit', limit);
  if (offset) qs.set('offset', offset);
 
  const url = `${getTelApiBase()}/api/v1/admin/enquiries${qs.toString() ? `?${qs.toString()}` : ''}`;
  const res = await fetch(url, {
    method: 'GET',
    headers: { Authorization: `Bearer ${auth.token}` },
    cache: 'no-store',
  });
  const data = await res.json().catch(() => ({}));
  return Response.json(data, { status: res.status });
}

