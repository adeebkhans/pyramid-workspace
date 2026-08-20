import { NextResponse, type NextRequest } from 'next/server';
import { GUEST_FLAG_COOKIE } from '@/shared/lib/session/guest-session';

const SIGN_IN_ROUTE = '/sign-in';
const WORKSPACE_ROUTE = '/tasks';

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
    if (pathname !== '/') destination.searchParams.set('next', pathname);
    return NextResponse.redirect(destination);
  }

  if (isSignedIn && (isSignInRoute || pathname === '/')) {
    return NextResponse.redirect(new URL(WORKSPACE_ROUTE, request.url));
  }

  return NextResponse.next();
}

export const config = {
  // CRITICAL: Expressly ignore ALL /api paths here so the config fallback can handle them natively
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|.*\\.svg$).*)'],
};
