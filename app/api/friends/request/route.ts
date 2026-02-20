import { NextRequest, NextResponse } from "next/server";
import fs from 'fs';
import path from 'path';

export async function POST(req: NextRequest) {
  try {
    const { senderId, receiverId } = await req.json();
    const filePath = path.join(process.cwd(), 'app/api/accounts/invitations.json');

    // Datei laden oder leeres Array erstellen
    let invitations = [];
    if (fs.existsSync(filePath)) {
      invitations = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    }

    // Prüfen, ob bereits eine Anfrage existiert
    const existing = invitations.find((i: any) => 
      (i.senderId === senderId && i.receiverId === receiverId) ||
      (i.senderId === receiverId && i.receiverId === senderId)
    );

    if (existing) {
      return NextResponse.json({ message: "Anfrage existiert bereits" }, { status: 400 });
    }

    // Neue Einladung hinzufügen
    const newInvitation = {
      id: crypto.randomUUID(),
      senderId,
      receiverId,
      status: 'pending',
      timestamp: new Date().toISOString()
    };
 
    invitations.push(newInvitation);
    fs.writeFileSync(filePath, JSON.stringify(invitations, null, 2));

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ message: "Server Fehler" }, { status: 500 });
  }
}