import { NextResponse } from 'next/server';
import query from '@/lib/db'; 

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    // Wir versuchen beide Varianten zu lesen, falls das Frontend mal so oder so schickt
    const eventId = searchParams.get('eventid') || searchParams.get('eventId');

    if (!eventId) {
      console.error("API Error: No eventId provided in URL");
      return NextResponse.json({ error: 'Missing eventid' }, { status: 400 });
    }

    // Nutze doppelte Anführungszeichen für den Spaltennamen "eventId"
    const result = await query`
      SELECT * FROM registrations 
      WHERE "eventId" = ${eventId}
    `;
    
    console.log(`Gefundene Meldungen für ${eventId}:`, result.length);

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('DB-QUERY FAILED:', error.message); 
    return NextResponse.json([], { status: 500 });
  }
}