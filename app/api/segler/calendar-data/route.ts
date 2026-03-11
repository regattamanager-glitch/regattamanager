import { NextRequest, NextResponse } from 'next/server';
import sql from "@/lib/db";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const seglerId = searchParams.get('seglerId');

  if (!seglerId) return NextResponse.json([]);

  try {
    const calendarData: any[] = [];

    // 1. EIGENE DATEN & FAVORITEN LADEN
    const userRows = await sql`SELECT gemerkt FROM accounts WHERE id = ${seglerId}`;
    const myFavorites = userRows[0]?.gemerkt || [];

    // 2. ALLE RELEVANTEN EVENTS LADEN
    // Wir holen Events, bei denen der Segler oder seine Freunde vorkommen könnten
    const events = await sql`
      SELECT id, name, datum_von, anmeldungen 
      FROM events
    `;

    // 3. FREUNDE LADEN (für den Abgleich)
    const friendsRows = await sql`
      SELECT 
        CASE WHEN sender_id = ${seglerId} THEN receiver_id ELSE sender_id END as friend_id
      FROM invitations 
      WHERE (sender_id = ${seglerId} OR receiver_id = ${seglerId}) AND status = 'accepted'
    `;
    const friendIds = friendsRows.map(f => f.friend_id);

    // 4. LOGIK-VERARBEITUNG
    events.forEach((event: any) => {
      const anmeldungen = typeof event.anmeldungen === 'string' 
        ? JSON.parse(event.anmeldungen) 
        : event.anmeldungen || {};

      // Check: Bin ich selbst angemeldet?
      const isMeRegistered = Object.values(anmeldungen).some((liste: any) => 
        Array.isArray(liste) && liste.some((reg: any) => 
          reg.seglerId === seglerId || reg.skipper?.seglerId === seglerId
        )
      );

      if (isMeRegistered) {
        calendarData.push({
          id: event.id,
          name: event.name,
          datumVon: event.datum_von,
          type: 'angemeldet'
        });
      }

      // Check: Ist das Event gemerkt?
      if (myFavorites.includes(event.id)) {
        calendarData.push({
          id: event.id + "-gemerkt",
          name: "⭐ " + event.name,
          datumVon: event.datum_von,
          type: 'gemerkt'
        });
      }

      // Check: Sind Freunde angemeldet? (Nur wenn ich nicht selbst schon gemeldet bin)
      if (!isMeRegistered) {
        const friendInEvent = Object.values(anmeldungen).some((liste: any) => 
          Array.isArray(liste) && liste.some((reg: any) => 
            friendIds.includes(reg.seglerId) || friendIds.includes(reg.skipper?.seglerId)
          )
        );

        if (friendInEvent) {
          calendarData.push({
            id: event.id + "-friend",
            name: event.name,
            datumVon: event.datum_von,
            type: 'freund'
          });
        }
      }
    });

    // 5. PERSÖNLICHE EREIGNISSE (aus der neuen DB-Tabelle personal_events)
    // Diese ersetzen die alte personal-events.json
    const personal = await sql`
      SELECT id, name, datum FROM personal_events WHERE segler_id = ${seglerId}
    `;

    personal.forEach((p: any) => {
      calendarData.push({
        id: p.id,
        name: "📝 " + p.name,
        datumVon: p.datum,
        type: 'privat'
      });
    });

    return NextResponse.json(calendarData);

  } catch (error) {
    console.error("Kalender API Error (SQL):", error);
    return NextResponse.json([]);
  }
}