import { NextResponse } from 'next/server';
import query from '@/lib/db';

// GET: Meldungen abrufen
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Akzeptiere beides: eventid (Frontend) oder eventId (Standard)
    const eventId = searchParams.get('eventid') || searchParams.get('eventId');

    if (!eventId) {
      return NextResponse.json({ error: 'Missing eventId' }, { status: 400 });
    }

    const result = await query`
      SELECT * FROM registrations 
      WHERE "eventId" = ${eventId}
    `;
    
    return NextResponse.json(result || []);
  } catch (error: any) {
    console.error('DB-ERROR:', error.message);
    return NextResponse.json([], { status: 200 }); 
  }
}

// DELETE: Einzelne Anmeldung löschen
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Keine gültige ID gefunden' }, { status: 400 });
    }

    // Löschvorgang
    await query`
      DELETE FROM registrations 
      WHERE id = ${id}
    `;

    console.log(`[DB] Registration ${id} gelöscht.`);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('DELETE FAILED:', error.message);
    return NextResponse.json({ error: 'Datenbankfehler beim Löschen' }, { status: 500 });
  }
}