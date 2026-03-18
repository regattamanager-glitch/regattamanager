import { NextResponse } from 'next/server';
import query from '@/lib/db'; 

// GET: Meldungen abrufen
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const eventId = searchParams.get('eventId');

    if (!eventId) {
      return NextResponse.json({ error: 'Missing eventId' }, { status: 400 });
    }

    // Einfache Abfrage ohne komplexe Casts, um 500er Fehler zu vermeiden
    const result = await query`
      SELECT * FROM registrations 
      WHERE "eventId" = ${eventId}
    `;
    
    // Logge im Terminal, was wirklich gefunden wurde
    console.log(`API Treffer für ${eventId}:`, result?.length || 0);

    return NextResponse.json(result || []);
  } catch (error: any) {
    console.error('DB-QUERY FAILED:', error.message); 
    // Wir senden ein leeres Array statt eines Fehlers, damit das Frontend nicht crasht
    return NextResponse.json([], { status: 200 }); 
  }
}

// DELETE: Einzelne Anmeldung löschen
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    // Wir versuchen die ID aus dem Query (?id=...) zu holen
    let id = searchParams.get('id');

    // Falls keine Query-ID da ist, nehmen wir das Ende des Pfads
    if (!id) {
      id = request.url.split('/').pop() || null;
    }

    if (!id || id === 'registrations') {
      return NextResponse.json({ error: 'Keine gültige ID gefunden' }, { status: 400 });
    }

    // Führe das Löschen aus
    const deleteResult = await query`
      DELETE FROM registrations 
      WHERE id = ${id}
    `;

    console.log(`Löschvorgang für ID ${id} erfolgreich.`);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('DELETE FAILED:', error.message);
    return NextResponse.json({ error: 'Datenbankfehler beim Löschen' }, { status: 500 });
  }
}