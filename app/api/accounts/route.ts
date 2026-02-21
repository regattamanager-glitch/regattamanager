import { NextResponse } from "next/server";
// Import auf 'db' korrigiert
import { getPrisma } from "@/lib/prisma";
import { Verein } from "@prisma/client";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const db = getPrisma();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    // FALL 1: Spezifischen Nutzer laden
    if (id) {
      // Zuerst in Seglern suchen (mit Relationen)
      const segler = await db.segler.findUnique({
        where: { id },
        include: { vereine: true }
      });

      if (segler) {
        return NextResponse.json({
          ...segler,
          type: "segler",
          // Hier fügen wir den Typ (v: Verein) hinzu:
          vereinsNamen: segler.vereine.map((v: Verein) => v.kuerzel || v.name),
          verein: segler.vereine.length > 0 
            ? (segler.vereine[0].kuerzel || segler.vereine[0].name) 
            : "",
        });
      }

      // Falls kein Segler, in Vereinen suchen
      const verein = await db.verein.findUnique({
        where: { id }
      });

      if (verein) {
        return NextResponse.json({
          ...verein,
          type: "verein"
        });
      }

      return NextResponse.json({ error: "Nutzer nicht gefunden" }, { status: 404 });
    }

    // FALL 2: Alle Nutzer laden (z.B. für Admin-Listen)
    const allSegler = await db.segler.findMany({ include: { vereine: true } });
    const allVereine = await db.verein.findMany();

    // Wir fügen den Typ hinzu, damit das Frontend sie unterscheiden kann
    const combined = [
      ...allSegler.map(s => ({ ...s, type: "segler" })),
      ...allVereine.map(v => ({ ...v, type: "verein" }))
    ];

    return NextResponse.json(combined);

  } catch (error) {
    console.error("Fehler in /api/accounts:", error);
    return NextResponse.json({ error: "Serverfehler" }, { status: 500 });
  }
}