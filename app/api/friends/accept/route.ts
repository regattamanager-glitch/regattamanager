import { NextRequest, NextResponse } from "next/server";
import fs from 'fs';
import path from 'path';

export async function POST(req: NextRequest) {
  try {
    const { userId, friendId } = await req.json();
    const filePath = path.join(process.cwd(), 'app/api/accounts/invitations.json');

    if (!fs.existsSync(filePath)) {
      return NextResponse.json({ message: "Datenbank nicht gefunden" }, { status: 404 });
    }

    const invitations = JSON.parse(fs.readFileSync(filePath, 'utf8'));

    // Suche die Einladung, wo DU der Empfänger bist und der ANDERE der Absender
    const inviteIndex = invitations.findIndex((inv: any) => 
      inv.senderId === friendId && 
      inv.receiverId === userId && 
      inv.status === 'pending'
    );

    if (inviteIndex === -1) {
      return NextResponse.json({ message: "Anfrage nicht gefunden" }, { status: 404 });
    }

    // Status aktualisieren
    invitations[inviteIndex].status = 'accepted';
    invitations[inviteIndex].acceptedAt = new Date().toISOString(); 

    fs.writeFileSync(filePath, JSON.stringify(invitations, null, 2));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Accept Friend Error:", error);
    return NextResponse.json({ message: "Server Fehler" }, { status: 500 });
  }
}