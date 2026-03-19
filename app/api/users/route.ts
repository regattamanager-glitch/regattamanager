import { NextResponse } from 'next/server';
import sql from "@/lib/db";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const searchTerm = searchParams.get("search");

    if (!searchTerm || searchTerm.length < 2) {
      return NextResponse.json([]);
    }

    const searchPattern = `%${searchTerm}%`;

    // Suche in der Tabelle "Segler"
    const users = await sql`
      SELECT 
        id, 
        vorname, 
        nachname, 
        email, 
        nation, 
        geburtsjahr, 
        "worldSailingId",
        "lizenzNummer"
      FROM "Segler"
      WHERE 
        vorname ILIKE ${searchPattern} 
        OR nachname ILIKE ${searchPattern} 
        OR email ILIKE ${searchPattern}
      LIMIT 10
    `;

    return NextResponse.json(users);
  } catch (error: any) {
    console.error("Search Error:", error.message);
    return NextResponse.json({ error: "Datenbankfehler" }, { status: 500 });
  }
}