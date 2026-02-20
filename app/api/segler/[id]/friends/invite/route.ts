import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function POST(req: Request) {
  try {
    const { senderId, friendIds, eventId, eventName } = await req.json();
    const folderPath = path.join(process.cwd(), 'app/api/accounts');
    const filePath = path.join(folderPath, 'invitations.json');

    // Ordner sicherheitshalber prüfen
    if (!fs.existsSync(folderPath)) {
      fs.mkdirSync(folderPath, { recursive: true });
    }

    // 1. Bestehende Einladungen laden
    let invitations = [];
    if (fs.existsSync(filePath)) {
      const fileData = fs.readFileSync(filePath, 'utf8');
      invitations = JSON.parse(fileData || "[]");
    }

    // 2. Neue Einträge generieren
    const timestamp = new Date().toISOString();
    const newEntries = friendIds.map((fId: string) => ({
      inviteId: crypto.randomUUID(), // Eindeutige ID für die Einladung
      from: senderId,
      to: fId,
      eventId,
      eventName, 
      status: 'pending',
      sentAt: timestamp
    }));

    // 3. Zusammenführen und Speichern
    const updatedInvitations = [...invitations, ...newEntries];
    fs.writeFileSync(filePath, JSON.stringify(updatedInvitations, null, 2));

    return NextResponse.json({ success: true, count: newEntries.length });
  } catch (error) {
    console.error("Invite Error:", error);
    return NextResponse.json({ error: "Server Fehler" }, { status: 500 });
  }
}