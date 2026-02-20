import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

export async function POST(request: Request) {
  try {
    const { clubId, message } = await request.json();
    const filePath = path.join(process.cwd(), 'app', 'api', 'clubs', 'broadcasts', 'broadcasts.json');

    // 1. Bestehende Nachrichten laden
    let broadcasts = [];
    try {
      const fileData = await fs.readFile(filePath, 'utf-8');
      broadcasts = JSON.parse(fileData);
    } catch (e) { broadcasts = []; }

    // 2. Zeitstempel für "vor 30 Tagen" berechnen
    const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);

    // 3. Neue Nachricht hinzufügen + Alte Nachrichten (30 Tage) filtern
    const newBroadcast = {
      id: crypto.randomUUID(),
      clubId,
      message,
      timestamp: Date.now()
    };
 
    const updatedBroadcasts = [
      newBroadcast,
      ...broadcasts.filter((b: any) => b.timestamp > thirtyDaysAgo)
    ];

    // 4. Speichern
    await fs.writeFile(filePath, JSON.stringify(updatedBroadcasts, null, 2));

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Fehler beim Senden" }, { status: 500 });
  }
}

export async function GET() {
  try {
    const filePath = path.join(process.cwd(), 'app', 'api', 'clubs', 'broadcasts', 'broadcasts.json');
    const fileData = await fs.readFile(filePath, 'utf-8');
    const broadcasts = JSON.parse(fileData);
    
    // Auch hier: Beim Lesen direkt alte Nachrichten (30 Tage) ignorieren/filtern
    const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
    const validBroadcasts = broadcasts.filter((b: any) => b.timestamp > thirtyDaysAgo);

    return NextResponse.json(validBroadcasts);
  } catch (e) {
    return NextResponse.json([]);
  }
}