// app/api/geocode/route.ts
import type { NextRequest } from 'next/server';

export async function GET(req: NextRequest) {
  const address = req.nextUrl.searchParams.get('address');
  if (!address) {
    return new Response(JSON.stringify({ error: 'Keine Adresse angegeben' }), { status: 400 });
  }

  const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}`;

  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'RegattaManager/1.0' // Nominatim verlangt User-Agent
      }
    }); 
    const data = await res.json();

    if (!data || data.length === 0) {
      return new Response(JSON.stringify({ error: 'Keine Koordinaten gefunden' }), { status: 404 });
    }

    const { lat, lon } = data[0];

    return new Response(JSON.stringify({ latitude: parseFloat(lat), longitude: parseFloat(lon) }));
  } catch (err) {
    return new Response(JSON.stringify({ error: 'Fehler beim Geocoding', details: err }), { status: 500 });
  }
}
