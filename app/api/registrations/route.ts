import { NextResponse } from 'next/server';
import query from '@/lib/db'; 

export async function GET() {
  try {
    // 1. Wir laden erst mal alles, um einen Spaltenfehler auszuschließen
    // 2. Wir nutzen try-catch, um den Fehler im Log zu sehen
    const result = await query`SELECT * FROM registrations`;
    
    // Falls das Frontend spezifische Namen erwartet, mappen wir sie hier sicherheitshalber
    const mappedResult = result.map((reg: any) => ({
      id: reg.id,
      seglerId: reg.seglerId || reg.segler_id, // fängt beides ab
      eventId: reg.eventId || reg.event_id,     // fängt beides ab
      klasse: reg.klasse,
      status: reg.status
    }));

    return NextResponse.json(mappedResult);
  } catch (error: any) {
    // WICHTIG: Das hier im Terminal lesen!
    console.error('DB-ERROR DETAILS:', error.message); 
    return NextResponse.json([], { status: 500 });
  }
}