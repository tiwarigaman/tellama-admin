/**
 * BFF: GET → {TEL_API_URL}/api/v1/admin/dashboard
 */
import { getVerifiedAccessTokenPayload } from '@/lib/require-admin';
import { getTelApiBase } from '@/lib/tel-api';

export const runtime = 'nodejs';

export async function GET() {
  const auth = getVerifiedAccessTokenPayload();
  if (auth.error) return auth.error;

  const url = `${getTelApiBase()}/api/v1/admin/dashboard`;
  const res = await fetch(url, {
    method: 'GET',
    headers: { Authorization: `Bearer ${auth.token}` },
    cache: 'no-store',
  });
  const data = await res.json().catch(() => ({}));
  return Response.json(data, { status: res.status });
}

