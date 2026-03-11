import { NextResponse } from 'next/server';
import sql from "@/lib/db";
import { v4 as uuidv4 } from 'uuid';

// 1. POST: Eine neue Nachricht für einen Club speichern
export async function POST(request: Request) {
  try {
    const { clubId, message } = await request.json();

    if (!clubId || !message) {
      return NextResponse.json({ error: "Daten unvollständig" }, { status: 400 });
    }

    const id = uuidv4();
    const timestamp = new Date().toISOString();

    // In die Tabelle club_broadcasts schreiben
    await sql`
      INSERT INTO club_broadcasts (id, club_id, message, timestamp)
      VALUES (${id}, ${clubId}, ${message}, ${timestamp});
    `;

    // Optional: Alte Nachrichten (älter als 30 Tage) direkt aus der DB löschen, 
    // um die Tabelle sauber zu halten (entspricht deiner alten Logik)
    await sql`
      DELETE FROM club_broadcasts 
      WHERE timestamp < NOW() - INTERVAL '30 days';
    `;

    return NextResponse.json({ success: true, id });
  } catch (error: any) {
    console.error("Broadcast POST Fehler:", error);
    return NextResponse.json({ error: "Fehler beim Senden" }, { status: 500 });
  }
}

// 2. GET: Alle gültigen Nachrichten der letzten 30 Tage abrufen
export async function GET() {
  try {
    // Nur Nachrichten abrufen, die jünger als 30 Tage sind
    const rows = await sql`
  SELECT 
    id, 
    club_id as "clubId", 
    message, 
    timestamp 
  FROM club_broadcasts
  WHERE timestamp > NOW() - INTERVAL '30 days'
  ORDER BY timestamp DESC;
`;

    return NextResponse.json(rows);
  } catch (error: any) {
    console.error("Broadcast GET Fehler:", error);
    // Bei Fehlern geben wir ein leeres Array zurück, damit das Frontend nicht abstürzt
    return NextResponse.json([]);
  }
}