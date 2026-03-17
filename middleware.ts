import { NextRequest, NextResponse } from 'next/server';

// Routes qui nécessitent une authentification
const PROTECTED_PREFIXES = [
  '/dashboard',
  '/friends',
  '/rankings',
  '/rooms',
  '/profile',
  '/room',
  '/session',
  '/admin',
];

// Routes accessibles uniquement si NON authentifié
const AUTH_ONLY_ROUTES = ['/login', '/register', '/onboarding'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hasSession = request.cookies.get('has_session')?.value === '1';

  const isProtected = PROTECTED_PREFIXES.some((p) => pathname.startsWith(p));
  const isAuthOnly = AUTH_ONLY_ROUTES.some((p) => pathname.startsWith(p));

  if (isProtected && !hasSession) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  if (isAuthOnly && hasSession && pathname !== '/onboarding') {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|assets/).*)',
  ],
};
