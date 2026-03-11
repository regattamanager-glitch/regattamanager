import { NextRequest, NextResponse } from "next/server";
import sql from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const { userId, friendId } = await req.json();

    if (!userId || !friendId) {
      return NextResponse.json({ message: "Fehlende IDs" }, { status: 400 });
    }

    // Wir aktualisieren den Status der Einladung in der Datenbank.
    // WICHTIG: Der userId ist hier der receiver_id (derjenige, der annimmt).
    const result = await sql`
      UPDATE invitations 
      SET 
        status = 'accepted',
        timestamp = NOW() -- Hier könnte man auch eine separate Spalte 'accepted_at' nutzen
      WHERE 
        sender_id = ${friendId} AND 
        receiver_id = ${userId} AND 
        status = 'pending'
      RETURNING id
    `;

    // Falls kein Datensatz gefunden wurde (z.B. schon angenommen oder existiert nicht)
    if (result.length === 0) {
      return NextResponse.json({ message: "Anfrage nicht gefunden oder bereits bearbeitet" }, { status: 404 });
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error("Accept Friend Error [SQL]:", error);
    return NextResponse.json({ message: "Server Fehler beim Annehmen der Anfrage" }, { status: 500 });
  }
}