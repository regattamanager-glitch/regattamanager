import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const filePath = path.join(process.cwd(), 'app/api/segler/personal-events.json');

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const seglerId = searchParams.get('seglerId');
  
  try {
    if (!fs.existsSync(filePath)) return NextResponse.json([]);
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    // Nur Ereignisse für diesen Segler zurückgeben
    return NextResponse.json(data.filter((e: any) => e.seglerId === seglerId));
  } catch (e) { return NextResponse.json([]); }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    let data = [];
    if (fs.existsSync(filePath)) {
      data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    }
     
    const newEntry = {
      id: Math.random().toString(36).substr(2, 9),
      seglerId: body.seglerId,
      name: body.name,
      datumVon: body.datum, // Wir nennen es datumVon für Kompatibilität mit dem Kalender
      type: 'privat'
    };
    
    data.push(newEntry);
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    return NextResponse.json({ success: true });
  } catch (e) { return NextResponse.json({ success: false }, { status: 500 }); }
}