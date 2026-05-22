import { NextResponse } from 'next/server';
import query from '@/lib/db';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { seglerId, worldSailingId, lizenzNummer, telefonNummer, notfallKontakt, sponsor } = body;

    if (!seglerId) {
      return NextResponse.json({ error: 'Segler ID fehlt' }, { status: 400 });
    }

    // Update der Stammdaten in der Segler-Tabelle
    await query`
      UPDATE "Segler" 
      SET 
        "worldSailingId" = ${worldSailingId || null},
        "lizenzNummer" = ${lizenzNummer || null},
        "telefonNummer" = ${telefonNummer || null},
        "notfallKontakt" = ${notfallKontakt || null},
        "sponsor" = ${sponsor || null}
      WHERE "id" = ${seglerId}
    `;

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Update Fehler:', error.message);
    return NextResponse.json({ error: 'Datenbank-Update fehlgeschlagen' }, { status: 500 });
  }
}