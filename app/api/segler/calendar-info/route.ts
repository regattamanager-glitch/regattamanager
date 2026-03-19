import { NextRequest, NextResponse } from "next/server";
import sql from "@/lib/db";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const seglerId = searchParams.get("seglerId");

  if (!seglerId) return NextResponse.json({ error: "ID fehlt" }, { status: 400 });

  try {
    // 1. Eigene Registrierungen (Tabelle: registrations)
    // Wir nutzen "eventId" und "seglerId" in Anführungszeichen, wie vom Server gefordert
    const myRegistrations = await sql`
      SELECT "eventId", "klasse" 
      FROM "registrations" 
      WHERE "seglerId" = ${seglerId}
    `;

    // 2. Deine Einladungen (Tabelle: event_Invitations)
    const invitations = await sql`
      SELECT "event_id" as "eventId" 
      FROM "event_Invitations"
      WHERE "receiver_id" = ${seglerId} 
      AND "status" = 'pending'
    `.catch(() => []);

    // 3. Deine Freunde (Tabelle: _SeglerFriends)
    const friendsRows = await sql`
      SELECT 
        CASE WHEN "A" = ${seglerId} THEN "B" ELSE "A" END as friend_id
      FROM "_SeglerFriends" 
      WHERE "A" = ${seglerId} OR "B" = ${seglerId}
    `.catch(() => []);

    console.log(`Erfolg! ${myRegistrations.length} Registrierungen für ${seglerId} geladen.`);

    return NextResponse.json({ 
      friends: friendsRows.map((f: any) => f.friend_id), 
      invitations,
      myRegistrations 
    });

  } catch (err) {
    console.error("Datenbank-Fehler in calendar-info:", err);
    return NextResponse.json({ friends: [], invitations: [], myRegistrations: [] });
  }
}