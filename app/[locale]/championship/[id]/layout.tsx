import type { Metadata } from "next";
import sql from "@/lib/db";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string; locale: string }>;
}): Promise<Metadata> {
  const { id } = await params;

  try {
    const rows = await sql`
      SELECT name, level
      FROM championships
      WHERE id = ${id}
      LIMIT 1
    `;
    const championship = rows[0];
    if (!championship) return { robots: { index: false } };

    const description = [championship.name, championship.level]
      .filter(Boolean)
      .join(" · ");

    return {
      title: championship.name || "Championship",
      description,
      openGraph: {
        title: championship.name || "Championship",
        description,
        type: "website",
        siteName: "Regatta Manager",
        images: [{ url: "/app-icon.png" }],
      },
    };
  } catch {
    // Metadata darf das Rendern der Seite nie verhindern
    return {};
  }
}

export default function ChampionshipLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
