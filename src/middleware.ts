import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Middleware is now a pass-through - no authentication required
export function middleware(request: NextRequest) {
  return NextResponse.next();
}

export const config = {
  matcher: [],
};
