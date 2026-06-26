'use client';

import { useEffect } from 'react';

/** Registriert den Service Worker, damit die App auf iPhone/Android installierbar ist. */
export default function PwaRegister() {
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!('serviceWorker' in navigator)) return;
    const onLoad = () => {
      navigator.serviceWorker.register('/sw.js').catch(() => {
        /* still funktionsfähig auch ohne SW */
      });
    };
    window.addEventListener('load', onLoad);
    return () => window.removeEventListener('load', onLoad);
  }, []);

  return null;
}
