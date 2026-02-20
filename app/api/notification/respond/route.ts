import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    if (!body || !body.inviteId || !body.action) {
      return NextResponse.json({ error: "Daten unvollständig" }, { status: 400 });
    }

    const { inviteId, action } = body;

    const invitePath = path.join(process.cwd(), 'app/api/accounts/invitations.json');
    const accountPath = path.join(process.cwd(), 'app/api/accounts/accounts.json');

    let invitations = JSON.parse(fs.readFileSync(invitePath, 'utf8'));
    const inviteIndex = invitations.findIndex((i: any) => String(i.id) === String(inviteId));

    if (inviteIndex === -1) {
      return NextResponse.json({ error: "Einladung nicht gefunden" }, { status: 404 });
    }

    const invite = invitations[inviteIndex];

    // --- LOGIK-WEICHE ---
 
    // FALL A: Event-Einladung
    if (invite.eventId) {
      if (action === 'accept') {
        // Status auf 'accepted' setzen, damit die UI weiß: "Hier geht's zum Event"
        invitations[inviteIndex].status = 'accepted';
        
        // Speichern der Änderung (Status-Update)
        fs.writeFileSync(invitePath, JSON.stringify(invitations, null, 2));

        // Erfolg melden und dem Frontend sagen, dass es weiterleiten soll
        return NextResponse.json({ 
          success: true, 
          type: 'event', 
          redirectTo: `/regatta/${invite.eventId}` // Pfad zur Event-Seite
        });
      } else {
        // Bei Ablehnung (decline) wird die Event-Einladung sofort gelöscht
        invitations = invitations.filter((i: any) => String(i.id) !== String(inviteId));
        fs.writeFileSync(invitePath, JSON.stringify(invitations, null, 2));
      }
    } 
    // FALL B: Freundschaftsanfrage
    else {
      if (action === 'accept') {
        let accounts = JSON.parse(fs.readFileSync(accountPath, 'utf8'));
        const { senderId, receiverId } = invite;

        accounts = accounts.map((acc: any) => {
          if (String(acc.id) === String(receiverId)) {
            const friends = acc.friends || [];
            if (!friends.includes(senderId)) return { ...acc, friends: [...friends, senderId] };
          }
          if (String(acc.id) === String(senderId)) {
            const friends = acc.friends || [];
            if (!friends.includes(receiverId)) return { ...acc, friends: [...friends, receiverId] };
          }
          return acc;
        });
        fs.writeFileSync(accountPath, JSON.stringify(accounts, null, 2));
      }
      
      // Freundschaftsanfragen werden nach Bearbeitung immer gelöscht (egal ob accept oder decline)
      invitations = invitations.filter((i: any) => String(i.id) !== String(inviteId));
      fs.writeFileSync(invitePath, JSON.stringify(invitations, null, 2));
    }

    return NextResponse.json({ success: true, type: invite.eventId ? 'event' : 'friend' });

  } catch (err) {
    console.error("Server Error:", err);
    return NextResponse.json({ error: "Interner Server Fehler" }, { status: 500 });
  }
}