// app/api/clubs/content/route.ts
import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const clubIds = searchParams.get('ids')?.split(',') || [];

  try {
    const eventsPath = path.join(process.cwd(), 'app/api/events/events.json');
    
    if (!fs.existsSync(eventsPath)) {
      return NextResponse.json({ events: [], nachrichten: [] });
    }

    const eventsData = JSON.parse(fs.readFileSync(eventsPath, 'utf8'));

    // 1. Filtern nach Verein
    const myClubEvents = eventsData.filter((e: any) => 
      clubIds.includes(e.vereinId)
    );

    // 2. Mapping: Wir übersetzen die Felder für das Frontend
    const mappedEvents = myClubEvents.map((e: any) => ({
      id: e.id,
      titel: e.name,           // 'name' wird zu 'titel'
      datum: e.datumVon,       // 'datumVon' wird zu 'datum'
      ort: e.location || e.land, // 'location' wird zu 'ort'
      privat: e.privat
    }));
 
    return NextResponse.json({
      events: mappedEvents,
      nachrichten: [] 
    });
  } catch (error) {
    return NextResponse.json({ events: [], nachrichten: [] });
  }
}