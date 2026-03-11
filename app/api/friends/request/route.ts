import { NextRequest, NextResponse } from "next/server";
import sql from "@/lib/db";
import crypto from "crypto";

export async function POST(req: NextRequest) {
  try {
    const { senderId, receiverId } = await req.json();

    if (!senderId || !receiverId) {
      return NextResponse.json({ message: "Sender oder Empfänger fehlt" }, { status: 400 });
    }

    // 1. Prüfen, ob bereits eine Anfrage in IRGENDEINE Richtung existiert
    // Das ersetzt das manuelle Suchen im JSON-Array
    const existing = await sql`
      SELECT id FROM invitations 
      WHERE (sender_id = ${senderId} AND receiver_id = ${receiverId})
         OR (sender_id = ${receiverId} AND receiver_id = ${senderId})
      LIMIT 1
    `;

    if (existing.length > 0) {
      return NextResponse.json({ message: "Anfrage existiert bereits" }, { status: 400 });
    }

    // 2. Neue Einladung in die Datenbank schreiben
    const newId = crypto.randomUUID();
    
    await sql`
      INSERT INTO invitations (id, sender_id, receiver_id, status, timestamp)
      VALUES (${newId}, ${senderId}, ${receiverId}, 'pending', NOW())
    `;

    return NextResponse.json({ success: true, id: newId });

  } catch (error) {
    console.error("FRIEND REQUEST ERROR:", error);
    return NextResponse.json({ message: "Server Fehler" }, { status: 500 });
  }
}