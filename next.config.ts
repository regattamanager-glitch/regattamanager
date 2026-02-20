import type { NextConfig } from "next";
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin();

const nextConfig: NextConfig = {
  /* Andere Optionen hier, aber ohne den turbo-Block */
};

export default withNextIntl(nextConfig);