import { NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';

export async function POST(request: Request) {
  try {
    const { requestId } = await request.json();

    if (!requestId) {
      return NextResponse.json({ error: "Anfrage-ID fehlt" }, { status: 400 });
    }

    // Wir löschen den Eintrag einfach aus der club_requests Tabelle
    // Das entspricht deiner Logik, die Anfrage aus der anfragen.json zu filtern
    await sql`
      DELETE FROM club_requests 
      WHERE id = ${requestId};
    `;

    console.log(`❌ Beitrittsanfrage ${requestId} wurde im Regatta Manager abgelehnt.`);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Fehler beim Ablehnen der Anfrage:", error);
    return NextResponse.json(
      { error: `Datenbank-Fehler: ${error.message}` }, 
      { status: 500 }
    );
  }
}