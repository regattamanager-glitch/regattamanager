import { NextRequest, NextResponse } from 'next/server';
import sql from "@/lib/db";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const seglerId = searchParams.get('seglerId');
  
  if (!seglerId) return NextResponse.json([]);

  try {
    // Wir suchen in der Tabelle 'events' nach allen Einträgen, 
    // in deren JSONB-Spalte 'anmeldungen' die seglerId vorkommt.
    const registrations = await sql`
      SELECT 
        id, 
        name, 
        datum_von, 
        anmeldungen 
      FROM events 
      WHERE anmeldungen::text LIKE '%' || ${seglerId} || '%'
    `;

    // Wir filtern und transformieren die Daten für das Kalender-Frontend
    const personalEvents = registrations.map((event: any) => {
      let allRegs = typeof event.anmeldungen === 'string' 
        ? JSON.parse(event.anmeldungen) 
        : event.anmeldungen;

      // Wir suchen die Klasse, in der der Segler gemeldet ist, um den Namen schöner zu machen
      let klasseName = "";
      for (const [klasse, liste] of Object.entries(allRegs)) {
        if (Array.isArray(liste) && liste.some((r: any) => 
          r.seglerId === seglerId || 
          r.skipper?.seglerId === seglerId || 
          (r.crew && r.crew.some((c: any) => c.id === seglerId))
        )) {
          klasseName = klasse;
          break;
        }
      }

      return {
        id: event.id,
        seglerId: seglerId,
        name: klasseName ? `${event.name} (${klasseName})` : event.name,
        datumVon: event.datum_von,
        type: 'angemeldet' // Da es aus echten Registrierungen kommt
      };
    });

    return NextResponse.json(personalEvents);
  } catch (e) {
    console.error("Personal Events SQL Error:", e);
    return NextResponse.json([]);
  }
}

// POST wird hier nicht mehr benötigt, da man "persönliche Events" 
// jetzt nicht mehr manuell erstellt, sondern sie durch eine Anmeldung entstehen.
export async function POST() {
  return NextResponse.json({ message: "Manuelle Einträge sind deaktiviert. Bitte melde dich zu einer Regatta an." }, { status: 405 });
}