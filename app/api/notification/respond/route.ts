import { NextResponse } from 'next/server';
import sql from "@/lib/db";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    if (!body || !body.inviteId || !body.action) {
      return NextResponse.json({ error: "Daten unvollständig" }, { status: 400 });
    }

    const { inviteId, action } = body;

    // 1. Zuerst prüfen: Ist es eine Event-Einladung?
    const eventInvite = await sql`
      SELECT * FROM event_invitations WHERE id = ${inviteId}
    `;

    if (eventInvite.length > 0) {
      const invite = eventInvite[0];

      if (action === 'accept') {
        // Status auf 'accepted' setzen
        await sql`
          UPDATE event_invitations 
          SET status = 'accepted' 
          WHERE id = ${inviteId}
        `;

        return NextResponse.json({ 
          success: true, 
          type: 'event', 
          redirectTo: `/regatta/${invite.event_id}` 
        });
      } else {
        // Bei Ablehnung: Löschen
        await sql`DELETE FROM event_invitations WHERE id = ${inviteId}`;
        return NextResponse.json({ success: true, type: 'event' });
      }
    }

    // 2. Falls nicht, prüfen: Ist es eine Freundschaftsanfrage?
    const friendInvite = await sql`
      SELECT * FROM invitations WHERE id = ${inviteId}
    `;

    if (friendInvite.length > 0) {
      const invite = friendInvite[0];

      if (action === 'accept') {
        // In einer relationalen DB lösen wir das "Freunde-Array" idealerweise 
        // über den Status in der 'invitations' Tabelle oder eine 'friends' Tabelle.
        // Hier setzen wir den Status auf 'accepted'.
        await sql`
          UPDATE invitations 
          SET status = 'accepted', timestamp = NOW() 
          WHERE id = ${inviteId}
        `;
        
        // HINWEIS: Falls du eine separate 'friends' Tabelle hast, 
        // müsstest du hier zusätzlich einen INSERT machen. 
        // Wenn du nur die 'invitations' Tabelle filterst, reicht das Update oben.
      } else {
        // Bei Ablehnung oder Löschung nach Bearbeitung:
        await sql`DELETE FROM invitations WHERE id = ${inviteId}`;
      }

      return NextResponse.json({ success: true, type: 'friend' });
    }

    return NextResponse.json({ error: "Einladung nicht gefunden" }, { status: 404 });

  } catch (err) {
    console.error("Notification Respond Error:", err);
    return NextResponse.json({ error: "Interner Server Fehler" }, { status: 500 });
  }
}