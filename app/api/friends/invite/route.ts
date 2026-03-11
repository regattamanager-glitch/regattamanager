import { NextRequest, NextResponse } from "next/server";
import sql from "@/lib/db";
import crypto from "crypto";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { senderId, friendIds, eventId, eventName } = body;

    // Validierung
    if (!senderId || !friendIds || !Array.isArray(friendIds) || !eventId) {
      return NextResponse.json({ message: "Ungültige Daten" }, { status: 400 });
    }

    // Wir erstellen die Einladungen parallel in der Datenbank
    // Promise.all ist hier sehr effizient für mehrere Inserts
    const newInvitations = await Promise.all(
      friendIds.map(async (receiverId: string) => {
        const id = crypto.randomUUID();
        
        await sql`
          INSERT INTO event_invitations (id, sender_id, receiver_id, event_id, event_name, status, created_at)
          VALUES (
            ${id}, 
            ${senderId}, 
            ${receiverId}, 
            ${eventId}, 
            ${eventName}, 
            'pending', 
            NOW()
          )
        `;
        
        return id;
      })
    );

    return NextResponse.json({ 
      success: true, 
      message: `${newInvitations.length} Einladungen erfolgreich verschickt` 
    });

  } catch (error) {
    console.error("API Error [Event Invite POST]:", error);
    return NextResponse.json({ 
      message: "Fehler beim Speichern der Einladungen in der Datenbank" 
    }, { status: 500 });
  }
}