import { cookies } from 'next/headers';
import {
  ACCESS_COOKIE,
  REFRESH_COOKIE,
  authCookieAttrs,
} from '@/lib/jwt-session';
import { getTelApiBase } from '@/lib/tel-api';

export const runtime = 'nodejs';

export async function POST() {
  const refresh = cookies().get(REFRESH_COOKIE)?.value;
  if (!refresh) {
    return Response.json({ error: 'No refresh session' }, { status: 401 });
  }

  const base = getTelApiBase();
  let res;
  try {
    res = await fetch(`${base}/api/v1/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken: refresh }),
    });
  } catch {
    return Response.json({ error: 'Cannot reach tel-backend' }, { status: 503 });
  }

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    return Response.json({ error: data.error || 'Refresh failed' }, { status: res.status });
  }

  const secure = process.env.NODE_ENV === 'production';
  const accessTtl = Math.floor(Number(data.expiresIn ?? data.expires_in));
  const refreshTtl = Math.floor(Number(data.refreshExpiresIn ?? data.refresh_expires_in));

  const json = Response.json({ ok: true });
  json.headers.append(
    'Set-Cookie',
    `${ACCESS_COOKIE}=${data.accessToken}; ${authCookieAttrs(accessTtl, secure, 43200)}`,
  );
  json.headers.append(
    'Set-Cookie',
    `${REFRESH_COOKIE}=${data.refreshToken}; ${authCookieAttrs(refreshTtl, secure, 2592000)}`,
  );
  return json;
}
