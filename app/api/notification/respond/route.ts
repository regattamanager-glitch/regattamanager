import { NextResponse } from 'next/server';
import sql from "@/lib/db";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { inviteId, action } = body;

    if (!inviteId || !action) {
      return NextResponse.json({ error: "IDs fehlen" }, { status: 400 });
    }

    // 1. Die Einladung finden, bevor wir sie löschen (um die IDs zu bekommen)
    const friendInvite = await sql`
      SELECT sender_id, receiver_id FROM invitations WHERE id = ${inviteId}
    `;

    if (friendInvite.length === 0) {
      // Vielleicht ist es eine Event-Einladung?
      const eventInvite = await sql`SELECT id FROM event_invitations WHERE id = ${inviteId}`;
      if (eventInvite.length > 0) {
        if (action === 'accept') {
          await sql`UPDATE event_invitations SET status = 'accepted' WHERE id = ${inviteId}`;
        } else {
          await sql`DELETE FROM event_invitations WHERE id = ${inviteId}`;
        }
        return NextResponse.json({ success: true });
      }
      return NextResponse.json({ error: "Anfrage nicht gefunden" }, { status: 404 });
    }

    const { sender_id, receiver_id } = friendInvite[0];

    if (action === 'accept') {
  // Prisma n:m Tabellen nutzen oft nur "A" und "B"
  // Wir sortieren, um Konsistenz zu wahren (A < B)
  const [id1, id2] = [sender_id, receiver_id].sort();
  
  try {
    await sql`
      INSERT INTO "_SeglerFriends" ("A", "B")
      VALUES (${id1}, ${id2})
      ON CONFLICT DO NOTHING
    `;
    console.log("Erfolg: Relation in _SeglerFriends mit A und B erstellt.");
  } catch (dbErr: any) {
    // Falls das auch fehlschlägt, loggen wir den Fehler, 
    // aber löschen die Einladung nicht, damit man es erneut versuchen kann.
    console.error("Datenbankfehler in _SeglerFriends:", dbErr.message);
    throw new Error(`DB-Fehler: ${dbErr.message}`); 
  }
}

    // B) IMMER löschen (egal ob accept oder decline), damit die Notification verschwindet
    await sql`DELETE FROM invitations WHERE id = ${inviteId}`;

    return NextResponse.json({ success: true });

  } catch (err: any) {
    console.error("KRITISCHER FEHLER:", err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}