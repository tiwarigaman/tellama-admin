import { NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import { ACCESS_COOKIE } from '@/lib/jwt-session';
import { isTelAccessTokenPayload } from '@/lib/tel-access-payload';

async function isAccessValid(token) {
  if (!token) return false;
  const secret = process.env.JWT_ACCESS_SECRET;
  if (!secret) return false;
  try {
    const { payload } = await jwtVerify(token, new TextEncoder().encode(secret));
    return isTelAccessTokenPayload(payload);
  } catch {
    return false;
  }
}

export async function middleware(request) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get(ACCESS_COOKIE)?.value;
  const valid = await isAccessValid(token);

  if (pathname.startsWith('/admin/login')) {
    if (valid) {
      return NextResponse.redirect(new URL('/admin', request.url));
    }
    return NextResponse.next();
  }

  if (pathname.startsWith('/admin')) {
    if (!valid) {
      return NextResponse.redirect(new URL('/admin/login', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin', '/admin/:path*'],
};
