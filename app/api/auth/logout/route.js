import { cookies } from 'next/headers';
import {
  ACCESS_COOKIE,
  REFRESH_COOKIE,
  LEGACY_SESSION_COOKIE,
  clearCookieAttrs,
} from '@/lib/jwt-session';
import { getTelApiBase } from '@/lib/tel-api';

export const runtime = 'nodejs';

export async function POST() {
  const secure = process.env.NODE_ENV === 'production';
  const base = getTelApiBase();

  const refresh = cookies().get(REFRESH_COOKIE)?.value;
  if (refresh) {
    try {
      await fetch(`${base}/api/v1/auth/logout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken: refresh }),
      });
    } catch {
      /* still clear cookies */
    }
  }

  const res = Response.json({ ok: true });
  res.headers.append('Set-Cookie', clearCookieAttrs(ACCESS_COOKIE, secure));
  res.headers.append('Set-Cookie', clearCookieAttrs(REFRESH_COOKIE, secure));
  res.headers.append('Set-Cookie', clearCookieAttrs(LEGACY_SESSION_COOKIE, secure));
  return res;
}
