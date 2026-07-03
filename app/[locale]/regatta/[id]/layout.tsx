import type { Metadata } from "next";
import sql from "@/lib/db";

function formatDate(value: unknown): string {
  if (!value) return "";
  const d = new Date(value as string);
  return isNaN(d.getTime()) ? "" : d.toISOString().split("T")[0];
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string; locale: string }>;
}): Promise<Metadata> {
  const { id } = await params;

  try {
    const rows = await sql`
      SELECT name, location, land, datum_von, datum_bis, privat
      FROM events
      WHERE id = ${id}
      LIMIT 1
    `;
    const event = rows[0];
    // Private Regatten nicht in Suchmaschinen/Link-Vorschauen bewerben
    if (!event || event.privat) return { robots: { index: false } };

    const von = formatDate(event.datum_von);
    const bis = formatDate(event.datum_bis);
    const place = [event.location, event.land].filter(Boolean).join(", ");
    const period = von && bis ? (von === bis ? von : `${von} – ${bis}`) : "";
    const description = [event.name, place, period].filter(Boolean).join(" · ");

    return {
      title: event.name || "Regatta",
      description,
      openGraph: {
        title: event.name || "Regatta",
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

export default function RegattaDetailLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
