import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "RegattaFinder" });

  return {
    title: "Regatta Finder",
    description: t("subtitle"),
    openGraph: {
      title: "Regatta Finder · Regatta Manager",
      description: t("subtitle"),
      type: "website",
      siteName: "Regatta Manager",
      images: [{ url: "/app-icon.png" }],
    },
  };
}

export default function RegattenLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
