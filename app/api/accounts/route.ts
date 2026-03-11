import { NextResponse } from "next/server";
import sql from '@/lib/db';

export const dynamic = "force-dynamic";
export const dynamicParams = true;
export const fetchCache = "force-no-store";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    // FALL 1: Spezifischen Nutzer laden
    if (id) {
      // Segler suchen inkl. verknüpfter Vereine über die Tabelle "_SeglerVereine"
      const seglerRows = await sql`
        SELECT s.*, 
               json_agg(v.*) FILTER (WHERE v.id IS NOT NULL) as vereine
        FROM "Segler" s
        LEFT JOIN "_SeglerVereine" sv ON s.id = sv."A"
        LEFT JOIN "Verein" v ON sv."B" = v.id
        WHERE s.id = ${id}
        GROUP BY s.id
        LIMIT 1
      `;
      
      const segler = seglerRows[0];

      if (segler) {
        const vereine = segler.vereine || [];
        return NextResponse.json({
          ...segler,
          type: "segler",
          vereinsNamen: vereine.map((v: any) => v.kuerzel || v.name),
          verein: vereine.length > 0 
            ? (vereine[0].kuerzel || vereine[0].name) 
            : "",
        });
      }

      // Falls kein Segler, als Verein suchen
      const vereinRows = await sql`SELECT * FROM "Verein" WHERE id = ${id} LIMIT 1`;
      const verein = vereinRows[0];

      if (verein) {
        return NextResponse.json({
          ...verein,
          type: "verein"
        });
      }

      return NextResponse.json({ error: "Nutzer nicht gefunden" }, { status: 404 });
    }

    // FALL 2: Alle Nutzer laden
    const allSegler = await sql`
      SELECT s.*, json_agg(v.*) FILTER (WHERE v.id IS NOT NULL) as vereine
      FROM "Segler" s
      LEFT JOIN "_SeglerVereine" sv ON s.id = sv."A"
      LEFT JOIN "Verein" v ON sv."B" = v.id
      GROUP BY s.id
    `;
    
    const allVereine = await sql`SELECT * FROM "Verein"`;

    const combined = [
      ...allSegler.map((s: any) => ({ ...s, type: "segler" })),
      ...allVereine.map((v: any) => ({ ...v, type: "verein" }))
    ];

    return NextResponse.json(combined);

  } catch (error) {
    console.error("Fehler in /api/accounts (SQL):", error);
    return NextResponse.json({ error: "Serverfehler beim Abrufen der Accounts" }, { status: 500 });
  }
}