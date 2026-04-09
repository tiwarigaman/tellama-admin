import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import { ACCESS_COOKIE } from '@/lib/jwt-session';
import { isTelAccessTokenPayload } from '@/lib/tel-access-payload';

/**
 * @returns {{ payload: object, token: string } | { error: Response }}
 */
export function getVerifiedAccessTokenPayload() {
  const store = cookies();
  const token = store.get(ACCESS_COOKIE)?.value;
  const secret = process.env.JWT_ACCESS_SECRET;
  if (!token || !secret) {
    return { error: Response.json({ error: 'Unauthorized' }, { status: 401 }) };
  }
  try {
    const p = jwt.verify(token, secret);
    if (!isTelAccessTokenPayload(p)) {
      return { error: Response.json({ error: 'Unauthorized' }, { status: 401 }) };
    }
    return { payload: p, token };
  } catch {
    return { error: Response.json({ error: 'Unauthorized' }, { status: 401 }) };
  }
}

export function getAdminAuthError() {
  const r = getVerifiedAccessTokenPayload();
  return r.error || null;
}
