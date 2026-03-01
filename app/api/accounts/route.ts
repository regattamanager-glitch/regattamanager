import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma"; // Umgestellt auf direkten Prisma 7 Export
import { Verein } from "@prisma/client";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    // FALL 1: Spezifischen Nutzer laden
    if (id) {
      const segler = await prisma.segler.findUnique({
        where: { id },
        include: { vereine: true }
      });

      if (segler) {
        return NextResponse.json({
          ...segler,
          type: "segler",
          vereinsNamen: segler.vereine.map((v: Verein) => v.kuerzel || v.name),
          verein: segler.vereine.length > 0 
            ? (segler.vereine[0].kuerzel || segler.vereine[0].name) 
            : "",
        });
      }

      const verein = await prisma.verein.findUnique({
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

    // FALL 2: Alle Nutzer laden (z. B. für Admin-Übersichten)
    const allSegler = await prisma.segler.findMany({ include: { vereine: true } });
    const allVereine = await prisma.verein.findMany();

    const combined = [
      ...allSegler.map(s => ({ ...s, type: "segler" })),
      ...allVereine.map(v => ({ ...v, type: "verein" }))
    ];

    return NextResponse.json(combined);

  } catch (error) {
    console.error("Fehler in /api/accounts:", error);
    return NextResponse.json({ error: "Serverfehler beim Abrufen der Accounts" }, { status: 500 });
  }
}