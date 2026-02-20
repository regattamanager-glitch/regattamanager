// navigation.ts
import { createNavigation } from 'next-intl/navigation';
import { defineRouting } from 'next-intl/routing';

export const routing = defineRouting({
  locales: ['de', 'en', 'fr', 'it', 'es', 'nl', 'el', 'hr', 'tr', 'pt'], // MÜSSEN alle vier hier stehen
  defaultLocale: 'en'
});

export const { Link, redirect, usePathname, useRouter, getPathname } = createNavigation(routing);