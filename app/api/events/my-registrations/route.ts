import { NextResponse } from "next/server";
import sql from "@/lib/db";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const seglerId = searchParams.get("seglerId");

    if (!seglerId) {
      return NextResponse.json({ error: "seglerId is required" }, { status: 400 });
    }

    // Wir holen die Event-Daten und verknüpfen sie mit den Registrierungs-Daten
    // Das "e.*" holt alle Event-Infos, "r.*" die Details der Anmeldung
    const registrations = await sql`
      SELECT 
        e.*, 
        r.klasse, 
        r.skipper, 
        r.boot, 
        r.crew, 
        r.extras, 
        r."paidAt"
      FROM events e
      JOIN registrations r ON e.id = r."eventId"
      WHERE r."seglerId" = ${seglerId}
      ORDER BY e.datum_von ASC
    `;

    // Da dein Dashboard das Format { [klasse]: [teilnehmer] } erwartet, 
    // bereiten wir die Daten hier direkt passend auf.
    const formattedEvents = registrations.map((reg: any) => {
      return {
        ...reg,
        // SQL Spaltennamen von snake_case zu camelCase für dein Frontend
        datumVon: reg.datum_von,
        datumBis: reg.datum_bis,
        // Hier bauen wir das 'segler' Objekt nach, das dein Dashboard sucht
        segler: {
          [reg.klasse]: [{
            skipper: typeof reg.skipper === 'string' ? JSON.parse(reg.skipper) : reg.skipper,
            boot: typeof reg.boot === 'string' ? JSON.parse(reg.boot) : reg.boot,
            crew: typeof reg.crew === 'string' ? JSON.parse(reg.crew) : (reg.crew || []),
            extras: typeof reg.extras === 'string' ? JSON.parse(reg.extras) : (reg.extras || []),
            paidAt: reg.paidAt
          }]
        }
      };
    });

    return NextResponse.json(formattedEvents);
  } catch (error: any) {
    console.error("Fehler in my-registrations API:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}