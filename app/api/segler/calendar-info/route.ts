import { NextRequest, NextResponse } from "next/server";
import sql from "@/lib/db";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const seglerId = searchParams.get("seglerId");

  if (!seglerId) {
    return NextResponse.json({ error: "ID fehlt" }, { status: 400 });
  }

  try {
    // 1. Freunde laden (IDs der akzeptierten Freundschaften)
    // Wir suchen in der 'invitations' Tabelle nach allen 'accepted' Einträgen
    const friendsRows = await sql`
      SELECT 
        CASE WHEN sender_id = ${seglerId} THEN receiver_id ELSE sender_id END as friend_id
      FROM invitations 
      WHERE (sender_id = ${seglerId} OR receiver_id = ${seglerId}) 
      AND status = 'accepted'
    `;
    const friends = friendsRows.map(row => row.friend_id);

    // 2. Event-Einladungen laden (Pending)
    // Hier ziehen wir die Daten aus 'event_invitations'
    const eventInvites = await sql`
      SELECT 
        id, 
        sender_id as "senderId", 
        receiver_id as "receiverId", 
        event_id as "eventId", 
        event_name as "eventName", 
        status, 
        created_at as "sentAt"
      FROM event_invitations
      WHERE receiver_id = ${seglerId} 
      AND status = 'pending'
    `;

    // Diagnose-Log (wie in deinem Original-Code)
    eventInvites.forEach(inv => {
       console.log(`✅ EINLADUNG GEFUNDEN: Event '${inv.eventName}' (ID: ${inv.eventId})`);
    });

    return NextResponse.json({ 
      friends, 
      invitations: eventInvites 
    });

  } catch (err) {
    console.error("Kritischer Fehler in SQL API [calendar-info]:", err);
    // Wir geben leere Arrays zurück, damit das Frontend nicht abstürzt
    return NextResponse.json({ friends: [], invitations: [] });
  }
}