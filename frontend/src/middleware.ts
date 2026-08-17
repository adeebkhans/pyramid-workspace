import { NextResponse, type NextRequest } from 'next/server';

import { GUEST_FLAG_COOKIE } from '@/shared/lib/session/guest-session';

const SIGN_IN_ROUTE = '/sign-in';
const WORKSPACE_ROUTE = '/tasks';

/**
 * Route gate.
 *
 * Runs on the edge before any page renders, so an unauthenticated visitor never
 * downloads the workspace shell. It only checks for the *presence* of a session
 * marker — every request that actually touches data is authorised by the API.
 *
 * NextAuth names its cookie differently once the connection is secure, hence
 * the two lookups.
 */
function hasSession(request: NextRequest): boolean {
  const guest = request.cookies.get(GUEST_FLAG_COOKIE);
  const federated =
    request.cookies.get('authjs.session-token') ?? request.cookies.get('__Secure-authjs.session-token');

  return Boolean(guest ?? federated);
}

export function middleware(request: NextRequest): NextResponse {
  const { pathname } = request.nextUrl;
  const isSignedIn = hasSession(request);
  const isSignInRoute = pathname.startsWith(SIGN_IN_ROUTE);

  if (!isSignedIn && !isSignInRoute) {
    const destination = new URL(SIGN_IN_ROUTE, request.url);
    // Remember where they were headed so sign-in can return them there.
    if (pathname !== '/') destination.searchParams.set('next', pathname);
    return NextResponse.redirect(destination);
  }

  if (isSignedIn && (isSignInRoute || pathname === '/')) {
    return NextResponse.redirect(new URL(WORKSPACE_ROUTE, request.url));
  }

  return NextResponse.next();
}

export const config = {
  // Everything except API routes, static assets and the favicon.
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|.*\\.svg$).*)'],
};
