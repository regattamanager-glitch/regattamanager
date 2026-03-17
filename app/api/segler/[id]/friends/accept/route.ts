import { NextResponse } from 'next/server';
import sql from "@/lib/db";

export async function POST(req: Request) {
  try {
    const { userId, friendId } = await req.json();

    if (!userId || !friendId) {
      return NextResponse.json({ error: "IDs fehlen" }, { status: 400 });
    }

    // 1. Update in der invitations Tabelle
    const updateResult = await sql`
      UPDATE invitations 
      SET status = 'accepted'
      WHERE 
        ((sender_id = ${friendId} AND receiver_id = ${userId}) 
        OR 
        (sender_id = ${userId} AND receiver_id = ${friendId}))
        AND status = 'pending'
      RETURNING id
    `;

    console.log("Einladung aktualisiert:", updateResult.length > 0);

    // 2. Eintrag in _SeglerFriends
    // Wir sortieren die IDs (A muss oft kleiner sein als B bei Prisma-Tabellen),
    // um Duplikate und Fehler zu vermeiden.
    const [id1, id2] = [userId, friendId].sort();

    try {
      await sql`
        INSERT INTO "_SeglerFriends" ("A", "B", "A_Segler_id", "B_Segler_id")
        VALUES (
          ${id1}, 
          ${id2}, 
          ${id1}, 
          ${id2}
        )
        ON CONFLICT DO NOTHING
      `;
      console.log("Eintrag in _SeglerFriends erfolgreich!");
    } catch (dbErr: any) {
      console.error("Fehler beim Schreiben in _SeglerFriends:", dbErr.message);
      // Wir werfen den Fehler nicht, damit die Einladung trotzdem als 'accepted' gilt
    }

    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error("Kritischer Fehler in Accept-Route:", error.message);
    return NextResponse.json({ error: "Server Fehler" }, { status: 500 });
  }
}