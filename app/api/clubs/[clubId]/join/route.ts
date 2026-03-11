import { NextResponse } from 'next/server';
import { createPool } from '@vercel/postgres';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ clubId: string }> }
) {
  // Wir holen uns die URL direkt aus der Umgebung
  const connectionString = process.env.POSTGRES_URL;

  if (!connectionString) {
    console.error("❌ KRITISCH: POSTGRES_URL ist nicht definiert!");
    return NextResponse.json({ error: "Datenbank-Verbindung nicht konfiguriert" }, { status: 500 });
  }

  const pool = createPool({ connectionString });

  try {
    const { clubId } = await params;
    const { userId, message } = await request.json();

    if (!userId) {
      return NextResponse.json({ error: 'User-ID fehlt' }, { status: 401 });
    }

    // Eine eindeutige ID für die Anfrage generieren
    const requestId = `req_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;

    // DATENBANK-SPEICHERUNG:
    // Wir schreiben direkt in die Tabelle 'club_requests' auf Neon
    await pool.query(`
      INSERT INTO club_requests (
        id, 
        club_id, 
        user_id, 
        message, 
        status, 
        timestamp
      ) VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP)
    `, [
      requestId, 
      clubId, 
      userId, 
      message || 'Beitrittsanfrage via Regatta Manager', 
      'PENDING'
    ]);

    console.log(`✅ Erfolg: Bewerbung ${requestId} für Club ${clubId} in Neon gespeichert.`);

    return NextResponse.json({ success: true, requestId }, { status: 201 });

  } catch (error: any) {
    console.error("❌ DATENBANK-FEHLER BEIM SPEICHERN:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  } finally {
    // Wichtig: Pool-Verbindung wieder freigeben
    await pool.end();
  }
}