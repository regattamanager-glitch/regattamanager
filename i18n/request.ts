// C:\Users\nicol\regatta-frontend-v3\i18n\request.ts
import { getRequestConfig } from 'next-intl/server';
import { routing } from '../navigation';

export default getRequestConfig(async ({ requestLocale }) => {
  let locale = await requestLocale;

  // Validierung des Locales
  if (!locale || !routing.locales.includes(locale as any)) {
    locale = routing.defaultLocale;
  }

  return {
    locale,
    // Dynamischer Import der JSON-Dateien (funktioniert in Edge & Node)
    messages: (await import(`../messages/${locale}.json`)).default
  };
});