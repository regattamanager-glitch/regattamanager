// C:\Users\nicol\regatta-frontend-v3\middleware.ts
import createMiddleware from 'next-intl/middleware';
import { NextRequest, NextResponse } from 'next/server';
import { routing } from './navigation';

const intlMiddleware = createMiddleware(routing);

export default async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // 1. Liste der unterstützten Sprachen für den Regex-Check
  const locales = ['de', 'en', 'fr', 'it', 'es', 'nl', 'el', 'hr', 'tr', 'pt'];
  const localePattern = `^\\/(${locales.join('|')})\\/dashboard`;
  const isDashboardPath = pathname.match(new RegExp(localePattern)) || pathname.startsWith('/dashboard');

  // 2. Dashboard-Schutz
  if (isDashboardPath) {
    // Wir prüfen beide Namen, um sicherzugehen, aber session_id ist unser Standard
    const sessionId = req.cookies.get("session_id")?.value || req.cookies.get("session")?.value;

    if (!sessionId) {
      // Extrahiere die Sprache aus dem Pfad oder nutze 'de' als Fallback
      const segments = pathname.split('/');
      const currentLocale = locales.includes(segments[1]) ? segments[1] : 'de';
      
      // Leite auf die lokalisierte Login-Seite um
      const loginUrl = new URL(`/${currentLocale}/login`, req.url);
      return NextResponse.redirect(loginUrl);
    }

    /* HINWEIS: Wir führen hier KEINEN fetch auf /api/accounts/check-session durch.
       Interne API-Aufrufe in der Middleware führen auf Vercel oft zu 307-Loops.
       Die Validierung der Session gegen die Datenbank findet sicherheitshalber 
       in der 'layout.tsx' oder 'page.tsx' des Dashboards statt.
    */
  }

  // 3. Internationalisierung anwenden
  return intlMiddleware(req);
}

export const config = {
  // Matcher deckt alle Pfade ab, außer statische Dateien und APIs
  matcher: ['/((?!api|_next|.*\\..*).*)']
};