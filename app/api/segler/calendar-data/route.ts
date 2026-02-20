import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const seglerId = searchParams.get('seglerId');

  try {
    const accountsPath = path.join(process.cwd(), 'app/api/accounts/accounts.json');
    const eventsPath = path.join(process.cwd(), 'app/api/events/events.json');
    const personalPath = path.join(process.cwd(), 'app/api/segler/personal-events.json');

    const accounts = JSON.parse(fs.readFileSync(accountsPath, 'utf8'));
    const events = JSON.parse(fs.readFileSync(eventsPath, 'utf8'));

    const me = accounts.find((a: any) => String(a.id) === String(seglerId));
    if (!me) return NextResponse.json([]);

    const calendarData: any[] = [];

    // --- 1. OFFIZIELLE EVENTS (Regatten) ---
    events.forEach((event: any) => {
      // Prüfen, ob ich angemeldet bin
      const isRegistered = Object.values(event.segler || {}).some((list: any) => 
        list.some((s: any) => String(s.id) === String(seglerId))
      );

      if (isRegistered) {
        calendarData.push({
          id: event.id,
          name: event.name,
          datumVon: event.datumVon, 
          type: 'angemeldet'
        });
      }

      // Gemerkt
      if (me.gemerkt?.includes(event.id)) {
        calendarData.push({
          id: event.id + "-gemerkt",
          name: "⭐ " + event.name,
          datumVon: event.datumVon,
          type: 'gemerkt'
        });
      }
    });

    // --- 2. EVENTS VON FREUNDEN ---
    const friends = accounts.filter((a: any) => me.friends?.includes(a.id));
    friends.forEach((friend: any) => {
      events.forEach((event: any) => {
        const friendRegistered = Object.values(event.segler || {}).some((list: any) => 
          list.some((s: any) => String(s.id) === String(friend.id))
        );
        
        // Nur wenn ich nicht selbst schon dort gemeldet bin
        const alreadyInList = calendarData.some(e => e.id === event.id);
        if (friendRegistered && !alreadyInList) {
          calendarData.push({
            id: event.id + "-friend",
            name: event.name,
            datumVon: event.datumVon,
            type: 'freund',
            seglerName: friend.vorname
          });
        }
      });
    });

    // --- 3. PERSÖNLICHE EREIGNISSE (Selbst eingetragen) ---
    if (fs.existsSync(personalPath)) {
      const personalEvents = JSON.parse(fs.readFileSync(personalPath, 'utf8'));
      const myPersonal = personalEvents.filter((p: any) => String(p.seglerId) === String(seglerId));
      
      myPersonal.forEach((p: any) => {
        calendarData.push({
          id: p.id,
          name: "📝 " + p.name,
          datumVon: p.datum, // Wichtig: p.datum aus deiner POST-Route wird zu datumVon
          type: 'privat'
        });
      });
    }

    return NextResponse.json(calendarData);

  } catch (error) {
    console.error("Kalender API Error:", error);
    return NextResponse.json([]);
  }
}