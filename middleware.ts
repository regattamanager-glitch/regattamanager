// C:\Users\nicol\regatta-frontend-v3\middleware.ts
import createMiddleware from 'next-intl/middleware';
import { NextRequest, NextResponse } from 'next/server';
import { routing } from './navigation';

const intlMiddleware = createMiddleware(routing);

export default async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Dashboard-Schutz
  if (pathname.match(/\/(de|en|fr|it|es|nl|el|hr|tr|pt)\/dashboard/) || pathname.startsWith('/dashboard')) {
    const sessionId = req.cookies.get("session")?.value;

    if (!sessionId) {
      return NextResponse.redirect(new URL("/login", req.url));
    }

    // ACHTUNG: Hier rufen wir eine API auf, die Node.js darf (siehe unten)
    try {
      const origin = req.nextUrl.origin;
      const checkRes = await fetch(`${origin}/api/accounts/check-session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId }),
      });

      if (!checkRes.ok) {
        return NextResponse.redirect(new URL("/login", req.url));
      }
    } catch (e) {
      return NextResponse.redirect(new URL("/login", req.url));
    }
  }

  return intlMiddleware(req);
}

export const config = {
  matcher: ['/', '/(de|en|fr|it|es|nl|el|hr|tr|pt)/:path*', '/((?!api|_next|.*\\..*).*)']
};