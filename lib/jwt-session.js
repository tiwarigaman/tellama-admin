/** HttpOnly cookie names — must match values set by /api/auth/login */

export const ACCESS_COOKIE = 'admin_access';
export const REFRESH_COOKIE = 'admin_refresh';

/** @deprecated cleared on logout for older sessions */
export const LEGACY_SESSION_COOKIE = 'admin_session';

/**
 * Build Set-Cookie attribute string. Non-positive TTL falls back to `fallbackSeconds`
 * so we never emit Max-Age=0 on login (that deletes the cookie immediately).
 */
export function authCookieAttrs(maxAgeSeconds, secure, fallbackSeconds = 43200) {
  const raw = Math.floor(Number(maxAgeSeconds));
  const age = Number.isFinite(raw) && raw > 0 ? raw : fallbackSeconds;
  const parts = ['Path=/', 'HttpOnly', 'SameSite=Lax', `Max-Age=${age}`];
  if (secure) parts.push('Secure');
  return parts.join('; ');
}

export function clearCookieAttrs(name, secure) {
  const parts = [`${name}=`, 'Path=/', 'HttpOnly', 'SameSite=Lax', 'Max-Age=0'];
  if (secure) parts.push('Secure');
  return parts.join('; ');
}
