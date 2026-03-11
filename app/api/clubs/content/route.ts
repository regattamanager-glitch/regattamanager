import { NextResponse } from 'next/server';
import sql from "@/lib/db";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const clubIds = searchParams.get('ids')?.split(',') || [];

  // Falls keine Club-IDs übergeben wurden, direkt leere Listen zurückgeben
  if (clubIds.length === 0) {
    return NextResponse.json({ events: [], nachrichten: [] });
  }

  const clubIdsParam = `{${clubIds.join(',')}}`;

try {
  const events = await sql`
  SELECT 
    id, 
    name as titel, 
    datum_von as datum, 
    location as ort, 
    privat,
    verein_id
  FROM events 
  WHERE verein_id = ANY(${clubIdsParam})
  ORDER BY datum_von ASC;
`;

    // 2. Mapping für das Frontend (falls noch SQL-spezifische Formate angepasst werden müssen)
    const mappedEvents = events.map((e: any) => ({
      id: e.id,
      titel: e.titel,
      datum: e.datum ? new Date(e.datum).toLocaleDateString('de-DE') : 'TBA',
      ort: e.ort || 'Vereinsgelände',
      privat: e.privat
    }));

    return NextResponse.json({
      events: mappedEvents,
      nachrichten: [] // Nachrichten werden separat über die Broadcast-Route geladen
    });

  } catch (error: any) {
    console.error("Content GET Fehler:", error);
    // Bei Fehlern (z.B. Tabelle noch nicht migriert) leeres Ergebnis liefern
    return NextResponse.json({ events: [], nachrichten: [] });
  }
}