import createMiddleware from 'next-intl/middleware';
import { NextRequest, NextResponse } from 'next/server';
import { routing } from './navigation';

const intlMiddleware = createMiddleware(routing);

export default async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // 1. Supported locales for regex check
  const locales = ['de', 'en', 'fr', 'it', 'es', 'nl', 'el', 'hr', 'tr', 'pt'];
  const localePattern = `^\\/(${locales.join('|')})\\/dashboard`;
  const isDashboardPath = pathname.match(new RegExp(localePattern)) || pathname.startsWith('/dashboard');

  // 2. Dashboard protection
  if (isDashboardPath) {
    const sessionId = req.cookies.get("session_id")?.value || req.cookies.get("session")?.value;

    if (!sessionId) {
      const segments = pathname.split('/');
      const currentLocale = locales.includes(segments[1]) ? segments[1] : 'en';
      
      const loginUrl = new URL(`/${currentLocale}/login`, req.url);
      return NextResponse.redirect(loginUrl);
    }
  }

  // 3. Apply internationalization
  return intlMiddleware(req);
}

export const config = {
  matcher: ['/((?!api|_next|.*\\..*).*)']
};