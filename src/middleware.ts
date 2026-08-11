import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const coupleSlug = request.cookies.get('couple_slug')?.value;
  const isRootPath = request.nextUrl.pathname === '/';

  if (isRootPath && coupleSlug && coupleSlug !== 'demo') {
    return NextResponse.redirect(new URL(`/c/${coupleSlug}`, request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: '/',
};
