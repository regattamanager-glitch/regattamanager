import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const invitationsPath = path.join(process.cwd(), "app/api/accounts/invitations.json");

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { senderId, friendIds, eventId, eventName } = body;

    if (!senderId || !friendIds || !Array.isArray(friendIds)) {
      return NextResponse.json({ message: "Ungültige Daten" }, { status: 400 });
    }

    // 1. Existierende Einladungen laden (falls Datei existiert)
    let invitations: any[] = [];
    if (fs.existsSync(invitationsPath)) {
      invitations = JSON.parse(fs.readFileSync(invitationsPath, "utf8"));
    }

    // 2. Neue Einladungen erstellen
    const timestamp = new Date().toISOString();
    const newInvitations = friendIds.map((receiverId: string) => ({
      id: `${senderId}_${receiverId}_${timestamp}`, // eindeutige ID
      senderId,
      receiverId,
      eventId,
      eventName,
      status: "pending", // noch nicht angenommen
      createdAt: timestamp
    }));
 
    // 3. Anhängen an bestehende Einladungen
    invitations.push(...newInvitations);

    // 4. Zurückschreiben in die JSON-Datei
    fs.writeFileSync(invitationsPath, JSON.stringify(invitations, null, 2), "utf8");

    return NextResponse.json({ success: true, added: newInvitations.length });
  } catch (error) {
    console.error("API Error [Friends POST]:", error);
    return NextResponse.json({ message: "Fehler beim Speichern der Einladung" }, { status: 500 });
  }
}
