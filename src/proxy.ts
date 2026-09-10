import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function proxy(request: NextRequest) {
  const host = request.headers.get('host') || '';
  const { pathname } = request.nextUrl;

  // Don't intercept static assets or Next.js internals
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/static') ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  // Admin subdomain routing: admin.asksite.com.tr or admin.localhost:3000
  const isAdminSubdomain = host.startsWith('admin.');
  if (isAdminSubdomain) {
    // Never rewrite API routes or paths already starting with /admin
    if (pathname.startsWith('/api') || pathname.startsWith('/admin')) {
      return NextResponse.next();
    }
    const url = request.nextUrl.clone();
    url.pathname = `/admin${pathname === '/' ? '' : pathname}`;
    return NextResponse.rewrite(url);
  }

  // Root path redirect to couple page if cookie exists
  const coupleSlug = request.cookies.get('couple_slug')?.value;
  const isRootPath = pathname === '/';

  if (isRootPath && coupleSlug && coupleSlug !== 'demo') {
    return NextResponse.redirect(new URL(`/c/${coupleSlug}`, request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
