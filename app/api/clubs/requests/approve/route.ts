import { NextResponse } from 'next/server';
import { createPool, sql } from '@vercel/postgres';

const pool = createPool({
  connectionString: process.env.POSTGRES_URL 
});

export async function POST(request: Request) {
  try {
    const { requestId, clubId, userId } = await request.json();

    if (!requestId || !clubId || !userId) {
      return NextResponse.json({ error: "Fehlende Daten" }, { status: 400 });
    }

    // 1. In die Verknüpfungstabelle _SeglerVereine eintragen
    // "A" ist die Segler-ID (userId), "B" ist die Vereins-ID (clubId)
    await pool.query(`
      INSERT INTO "_SeglerVereine" ("A", "B") 
      VALUES ($1::uuid, $2::uuid)
      ON CONFLICT DO NOTHING
    `, [userId, clubId]);

    // 2. Die Anfrage aus der club_requests Tabelle löschen
    // Da sie akzeptiert wurde, wird sie dort nicht mehr benötigt
    await sql`
      DELETE FROM club_requests 
      WHERE id = ${requestId};
    `;

    return NextResponse.json({ 
      success: true, 
      message: "Mitglied hinzugefügt und Anfrage gelöscht" 
    });

  } catch (error: any) {
    console.error("❌ Fehler beim Verarbeiten der Anfrage:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}