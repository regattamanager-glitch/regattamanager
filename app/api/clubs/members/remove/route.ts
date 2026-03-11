import { NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';

export async function POST(request: Request) {
  try {
    const { clubId, userId } = await request.json();

    if (!clubId || !userId) {
      return NextResponse.json({ error: 'Club-ID oder User-ID fehlt' }, { status: 400 });
    }

    // Im Regatta Manager liegen Mitgliedschaften in der Tabelle _SeglerVereine
    // "A" ist die Segler-ID (userId), "B" ist die Vereins-ID (clubId)
    const result = await sql`
      DELETE FROM "_SeglerVereine"
      WHERE "A"::text = ${userId}::text 
      AND "B"::text = ${clubId}::text
    `;

    console.log(`✅ Mitgliedschaft zwischen User ${userId} und Club ${clubId} im Regatta Manager beendet.`);

    return NextResponse.json({ 
      success: true, 
      message: "Mitglied erfolgreich entfernt" 
    });

  } catch (error: any) {
    console.error("Datenbank-Fehler beim Entfernen des Mitglieds:", error);
    return NextResponse.json(
      { error: `Fehler beim Datenbank-Update: ${error.message}` }, 
      { status: 500 }
    );
  }
}