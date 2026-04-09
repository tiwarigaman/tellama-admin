import {
  ACCESS_COOKIE,
  REFRESH_COOKIE,
  authCookieAttrs,
} from '@/lib/jwt-session';
import { getTelApiBase } from '@/lib/tel-api';

export const runtime = 'nodejs';

export async function POST(request) {
  try {
    const body = await request.json();
    const username = typeof body?.username === 'string' ? body.username : '';
    const password = typeof body?.password === 'string' ? body.password : '';

    const base = getTelApiBase();
    let res;
    try {
      res = await fetch(`${base}/api/v1/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
    } catch {
      return Response.json(
        {
          error:
            'Cannot reach tel-backend. Run it on port 4000 (or set TEL_API_URL) and try again.',
        },
        { status: 503 },
      );
    }

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return Response.json({ error: data.error || 'Login failed' }, { status: res.status });
    }

    const secure = process.env.NODE_ENV === 'production';
    const accessTtl = Math.floor(Number(data.expiresIn ?? data.expires_in));
    const refreshTtl = Math.floor(Number(data.refreshExpiresIn ?? data.refresh_expires_in));

    const json = Response.json({
      ok: true,
      role: data.role ?? null,
      email: data.email ?? null,
      expiresIn: Number.isFinite(accessTtl) && accessTtl > 0 ? accessTtl : null,
    });
    json.headers.append(
      'Set-Cookie',
      `${ACCESS_COOKIE}=${data.accessToken}; ${authCookieAttrs(accessTtl, secure, 43200)}`,
    );
    json.headers.append(
      'Set-Cookie',
      `${REFRESH_COOKIE}=${data.refreshToken}; ${authCookieAttrs(refreshTtl, secure, 2592000)}`,
    );
    return json;
  } catch {
    return Response.json({ error: 'Login failed' }, { status: 400 });
  }
}
