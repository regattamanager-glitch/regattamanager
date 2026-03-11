import { NextResponse } from 'next/server';
import sql from "@/lib/db";
import crypto from "crypto";

export async function POST(req: Request) {
  try {
    const { senderId, friendIds, eventId, eventName } = await req.json();

    if (!senderId || !friendIds || !Array.isArray(friendIds) || !eventId) {
      return NextResponse.json({ error: "Daten unvollständig" }, { status: 400 });
    }

    // Wir erstellen die Einladungen in der Datenbank.
    // Wie in den vorherigen Routen nutzen wir Promise.all für effiziente parallele Inserts.
    const newEntries = await Promise.all(
      friendIds.map(async (fId: string) => {
        const inviteId = crypto.randomUUID();
        
        await sql`
          INSERT INTO event_invitations (
            id, 
            sender_id, 
            receiver_id, 
            event_id, 
            event_name, 
            status, 
            created_at
          )
          VALUES (
            ${inviteId}, 
            ${senderId}, 
            ${fId}, 
            ${eventId}, 
            ${eventName}, 
            'pending', 
            NOW()
          )
        `;
        
        return inviteId;
      })
    );

    return NextResponse.json({ 
      success: true, 
      count: newEntries.length 
    });

  } catch (error) {
    console.error("Invite Error (SQL):", error);
    // Falls ein Unique Constraint verletzt wird (z.B. Einladung existiert schon),
    // fangen wir das hier ab oder lassen es als Server-Fehler loggen.
    return NextResponse.json({ error: "Server Fehler beim Versenden der Einladungen" }, { status: 500 });
  }
}