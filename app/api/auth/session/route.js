import { getVerifiedAccessTokenPayload } from '@/lib/require-admin';

export const runtime = 'nodejs';

export async function GET() {
  const auth = getVerifiedAccessTokenPayload();
  if (auth.error) return auth.error;

  const p = auth.payload;
  return Response.json({
    role: typeof p.role === 'string' ? p.role : null,
    email: typeof p.email === 'string' ? p.email : null,
    sub: p.sub != null ? String(p.sub) : null,
  });
}
