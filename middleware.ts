import createMiddleware from 'next-intl/middleware';
import { NextRequest, NextResponse } from 'next/server';
import { routing } from './navigation';

const intlMiddleware = createMiddleware(routing);

export default async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // 1. SCHNELLSPUR: API-Routen sofort abfangen und direkt zum Server durchwinken
  // Das funktioniert jetzt, weil der Matcher weiter unten API-Routen zur Middleware zulässt!
  if (pathname.startsWith('/api/')) {
    return NextResponse.next();
  }

  // 2. Unterstützte Sprachen für die Dashboard-Erkennung
  const locales = ['de', 'en', 'fr', 'it', 'es', 'nl', 'el', 'hr', 'tr', 'pt'];
  const localePattern = `^\\/(${locales.join('|')})\\/dashboard`;
  const isDashboardPath = pathname.match(new RegExp(localePattern)) || pathname.startsWith('/dashboard');

  // /admin ebenfalls schützen. Die echte Admin-Rechteprüfung erfolgt
  // serverseitig in /api/admin/data (requireAdmin); hier wird nur eine
  // gültige Session verlangt, damit die Seite nicht offen zugänglich ist.
  const adminPattern = `^\\/(${locales.join('|')})\\/admin`;
  const isAdminPath = pathname.match(new RegExp(adminPattern)) || pathname.startsWith('/admin');

  // 3. Dashboard-Schutz (Angepasst)
if (isDashboardPath || isAdminPath) {
  // AUSNAHME: Wenn der User auf dem Weg zur "Pending"-Seite ist, lassen wir ihn durch,
  // auch ohne Session-Cookie.
  if (pathname.endsWith('/dashboard/pending-approval')) {
    return NextResponse.next();
  }

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
  // Geändert: API wird hier NICHT mehr ausgeschlossen, damit die "if (pathname.startsWith('/api/'))" 
  // Bedingung oben im Code die API-Routen aktiv vor next-intl beschützen kann.
  matcher: ['/((?!_next|.*\\..*).*)']
};
