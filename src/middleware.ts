import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const PUBLIC_ADMIN_PATHS = ['/admin/login'];
const ADMIN_PREFIX = '/admin';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Only handle admin routes
  if (!pathname.startsWith(ADMIN_PREFIX)) {
    return NextResponse.next();
  }

  // Allow public admin paths
  if (PUBLIC_ADMIN_PATHS.some(path => pathname === path)) {
    return NextResponse.next();
  }

  // Check for auth token
  const token = request.cookies.get('admin_token')?.value;

  if (!token) {
    const loginUrl = new URL('/admin/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Token exists, let the route handler verify it
  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*'],
};
