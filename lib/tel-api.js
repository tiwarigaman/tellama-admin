/**
 * Server-side base URL for tel-backend (scheme + host + port, no path, no trailing slash).
 * All BFF routes (`app/api/**`) proxy upstream with `fetch(\`\${getTelApiBase()}/api/v1/...\`)`.
 *
 * Priority: `TEL_API_URL` (server-only, recommended) → `NEXT_PUBLIC_TEL_API_URL` →
 * `NEXT_PUBLIC_API_URL` → `http://localhost:4000`.
 */
export function getTelApiBase() {
  const raw =
    process.env.TEL_API_URL ||
    process.env.NEXT_PUBLIC_TEL_API_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    'http://localhost:4000';
  return String(raw).trim().replace(/\/$/, '');
}
