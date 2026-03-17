import { NextResponse } from 'next/server';
import sql from "@/lib/db";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  // Wichtig für Next.js 15: await params
  const { id: seglerId } = await params;

  try {
    const friends = await sql`
      SELECT 
        s.id, 
        s.vorname, 
        s.nachname, 
        s.profilbild,
        s.nation,
        'accepted' as status
      FROM "Segler" s
      JOIN "_SeglerFriends" f ON (
        (f."A" = s.id AND f."B" = ${seglerId}) OR 
        (f."B" = s.id AND f."A" = ${seglerId})
      )
    `;

    return NextResponse.json(friends);
  } catch (error: any) {
    console.error("Fehler beim Laden der Freunde:", error.message);
    return NextResponse.json({ error: "Fehler beim Laden" }, { status: 500 });
  }
}