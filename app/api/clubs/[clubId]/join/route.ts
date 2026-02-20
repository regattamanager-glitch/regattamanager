import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ clubId: string }> }
) {
  // NEUER PFAD: Wir navigieren vom Root in den spezifischen Ordner
  const filePath = path.join(
    process.cwd(), 
    'app', 'api', 'clubs', 'anfragen.json'
  );

  try {
    const { clubId } = await params;
    const { userId, message } = await request.json();

    if (!userId) {
      return NextResponse.json({ error: 'User-ID fehlt' }, { status: 401 });
    }
 
    // --- DATEI LESEN ---
    let requests = [];
    try {
      const fileData = await fs.readFile(filePath, 'utf-8');
      requests = JSON.parse(fileData || '[]');
    } catch (e) {
      // Falls die Datei nicht existiert oder Pfad falsch ist
      console.log("Datei nicht gefunden oder leer, starte neues Array.");
      requests = [];
    }

    // --- NEUEN EINTRAG ERSTELLEN ---
    const newEntry = {
      id: `req_${Date.now()}`,
      clubId,
      userId,
      message: message || 'Beitrittsanfrage',
      status: 'PENDING',
      timestamp: new Date().toISOString()
    };

    requests.push(newEntry);

    // --- SPEICHERN ---
    await fs.writeFile(filePath, JSON.stringify(requests, null, 2), 'utf-8');

    console.log(`✅ Gespeichert in app/api/clubs/anfragen.json`);

    return NextResponse.json({ success: true }, { status: 201 });

  } catch (error: any) {
    console.error("SERVER-FEHLER:", error);
    return NextResponse.json(
      { error: `Speicherfehler: ${error.message}` },
      { status: 500 }
    );
  }
}