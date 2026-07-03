import type { NextConfig } from "next";
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin();

const nextConfig: NextConfig = {
  // Eigenständiger Server-Build -> wird in die Desktop-App (Electron) gebündelt,
  // damit die App lokal läuft (kein Vercel/Webseiten-Umweg).
  output: "standalone",
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default withNextIntl(nextConfig);