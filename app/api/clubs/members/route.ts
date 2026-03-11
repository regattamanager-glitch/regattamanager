import { NextResponse } from 'next/server';
import { createPool } from '@vercel/postgres';

const pool = createPool({
  connectionString: process.env.POSTGRES_URL 
});

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const clubId = searchParams.get('clubId');

  if (!clubId) return NextResponse.json([]);

  try {
    // Prisma nutzt "A" für Segler-ID und "B" für Vereins-ID
    const { rows: members } = await pool.query(`
      SELECT 
        s.id, s.vorname, s.nachname, s.email, s.nation
      FROM "Segler" s
      JOIN "_SeglerVereine" sv ON s.id = sv."A"
      WHERE sv."B"::text = $1::text
    `, [clubId]);

    return NextResponse.json(members);
  } catch (error: any) {
    console.error("❌ Fehler Mitglieder-Liste (Main Query):", error.message);
    
    try {
      // Fallback: Nur die IDs holen, falls der Join scheitert
      const { rows: fallback } = await pool.query(
        'SELECT "A" as id FROM "_SeglerVereine" WHERE "B"::text = $1::text', 
        [clubId]
      );
      return NextResponse.json(fallback);
    } catch (fallbackError: any) {
      console.error("❌ Fehler Mitglieder-Liste (Fallback):", fallbackError.message);
      return NextResponse.json({ error: fallbackError.message }, { status: 500 });
    }
  }
}