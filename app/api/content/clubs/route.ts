import { NextResponse } from 'next/server';
import { createPool } from '@vercel/postgres';

export async function GET() {
  // Wir erstellen den Pool manuell mit deiner existierenden URL-Variable
  const pool = createPool({
    connectionString: process.env.DATABASE_URL // Ersetze DATABASE_URL durch deinen exakten Namen
  });

  try {
    const { rows: clubs } = await pool.query('SELECT * FROM "Verein" ORDER BY name ASC');
    
    return NextResponse.json(clubs.map(c => ({
      id: c.id,
      name: c.name,
      kuerzel: c.kuerzel,
      logo: c.profilbild,
      istPrivat: false
    })));
  } catch (error: any) {
    console.error("Pool-Fehler:", error.message);
    return NextResponse.json([]);
  }
}