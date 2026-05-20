import createMiddleware from 'next-intl/middleware';
import { NextRequest, NextResponse } from 'next/server';
import { routing } from './navigation';

const intlMiddleware = createMiddleware(routing);

export default async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // 1. SCHNELLSPUR: API-Routen sofort ignorieren und direkt zum Server durchwinken
  if (pathname.startsWith('/api/')) {
    return NextResponse.next();
  }

  // 2. Unterstützte Sprachen für die Dashboard-Erkennung
  const locales = ['de', 'en', 'fr', 'it', 'es', 'nl', 'el', 'hr', 'tr', 'pt'];
  const localePattern = `^\\/(${locales.join('|')})\\/dashboard`;
  const isDashboardPath = pathname.match(new RegExp(localePattern)) || pathname.startsWith('/dashboard');

  // 3. Dashboard-Schutz (Unverändert übernommen)
  if (isDashboardPath) {
    const sessionId = req.cookies.get("session_id")?.value || req.cookies.get("session")?.value;

    if (!sessionId) {
      const segments = pathname.split('/');
      const currentLocale = locales.includes(segments[1]) ? segments[1] : 'en';
      
      const loginUrl = new URL(`/${currentLocale}/login`, req.url);
      return NextResponse.redirect(loginUrl);
    }
  }

  // 4. Internationalisierung anwenden (Unverändert übernommen)
  return intlMiddleware(req);
}

export const config = {
  // Schützt vor unnötigen Aufrufen bei statischen Dateien
  matcher: ['/((?!api|_next|.*\\..*).*)']
};
