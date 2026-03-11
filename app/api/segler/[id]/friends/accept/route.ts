import { NextResponse } from 'next/server';
import sql from "@/lib/db";

export async function POST(req: Request) {
  try {
    const { userId, friendId } = await req.json();

    if (!userId || !friendId) {
      return NextResponse.json({ error: "IDs fehlen" }, { status: 400 });
    }

    // In SQL ist die "gegenseitige" Freundschaft durch den Status in der invitations-Tabelle definiert.
    // Wir suchen die Anfrage (egal wer Sender/Empfänger war) und setzen sie auf 'accepted'.
    const result = await sql`
      UPDATE invitations 
      SET 
        status = 'accepted',
        timestamp = NOW()
      WHERE 
        ((sender_id = ${friendId} AND receiver_id = ${userId}) 
        OR 
        (sender_id = ${userId} AND receiver_id = ${friendId}))
        AND status = 'pending'
      RETURNING id
    `;

    if (result.length === 0) {
      // Prüfen, ob sie vielleicht schon befreundet sind
      const alreadyFriends = await sql`
        SELECT id FROM invitations 
        WHERE ((sender_id = ${friendId} AND receiver_id = ${userId}) 
           OR (sender_id = ${userId} AND receiver_id = ${friendId}))
          AND status = 'accepted'
      `;

      if (alreadyFriends.length > 0) {
        return NextResponse.json({ 
          success: true, 
          message: "Ihr seid bereits im Logbuch befreundet" 
        });
      }

      return NextResponse.json({ error: "Keine offene Anfrage gefunden" }, { status: 404 });
    }

    return NextResponse.json({ 
      success: true, 
      message: "Freundschaft im Regatta Manager Logbuch eingetragen" 
    });

  } catch (error) {
    console.error("Fehler beim Verarbeiten der Freundschaft (SQL):", error);
    return NextResponse.json({ error: "Server Fehler" }, { status: 500 });
  }
}