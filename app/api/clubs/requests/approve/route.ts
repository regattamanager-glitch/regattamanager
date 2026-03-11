import { NextResponse } from 'next/server';
import sql from "@/lib/db";

export async function POST(request: Request) {
  try {
    const { requestId, clubId, userId } = await request.json();

    if (!requestId || !clubId || !userId) {
      return NextResponse.json({ error: "Fehlende Daten" }, { status: 400 });
    }

    // 1. Mitglied zum Verein hinzufügen
    await sql`
      INSERT INTO "_SeglerVereine" ("A", "B")
      VALUES (${userId}::uuid, ${clubId}::uuid)
      ON CONFLICT DO NOTHING
    `;

    // 2. Anfrage aus club_requests löschen
    await sql`
      DELETE FROM club_requests
      WHERE id = ${requestId};
    `;

    return NextResponse.json({
      success: true,
      message: "Mitglied hinzugefügt und Anfrage gelöscht"
    });

  } catch (error: any) {
    console.error("❌ Fehler beim Verarbeiten der Anfrage:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}