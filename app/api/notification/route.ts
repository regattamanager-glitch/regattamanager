import { NextRequest, NextResponse } from 'next/server';
import sql from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const userId = url.searchParams.get("userId");

    // Falls eine userId übergeben wurde, filtern wir direkt in der DB.
    // Falls nicht (für Admin/Dashboard), laden wir alles.
    
    let friendInvites;
    let eventInvites;

    if (userId) {
      // Nur Einladungen für diesen spezifischen Segler laden
      friendInvites = await sql`
        SELECT *, 'friend' as type FROM invitations 
        WHERE receiver_id = ${userId} AND status = 'pending'
      `;
      eventInvites = await sql`
        SELECT *, 'event' as type FROM event_invitations 
        WHERE receiver_id = ${userId} AND status = 'pending'
      `;
    } else {
      // Alle laden (alter Fallback der JSON-Datei)
      friendInvites = await sql`SELECT *, 'friend' as type FROM invitations`;
      eventInvites = await sql`SELECT *, 'event' as type FROM event_invitations`;
    }

    // Beide Arrays zusammenführen
    // Wir mappen die DB-Felder (snake_case) auf die Frontend-Felder (camelCase),
    // damit dein bestehendes Frontend ohne Änderungen weiterarbeitet.
    const combined = [...friendInvites, ...eventInvites].map((inv: any) => ({
      id: inv.id,
      senderId: inv.sender_id,
      receiverId: inv.receiver_id,
      status: inv.status,
      timestamp: inv.timestamp || inv.created_at,
      eventId: inv.event_id || null,
      eventName: inv.event_name || null,
      type: inv.type
    }));

    // Sortieren nach Datum (neueste zuerst)
    combined.sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );

    return NextResponse.json(combined);

  } catch (error) {
    console.error("Notification GET Error:", error);
    return NextResponse.json([]);
  }
}