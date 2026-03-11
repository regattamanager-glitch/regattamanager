import { NextRequest, NextResponse } from "next/server";
import sql from "@/lib/db";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: seglerId } = await params;

    // Wir holen alle Accounts, die mit dem seglerId befreundet sind.
    // Ein JOIN zwischen 'accounts' und 'invitations' findet die passenden Profile.
    const friends = await sql`
      SELECT 
        a.id, 
        a.vorname, 
        a.nachname, 
        a.email,
        a.name as account_name -- Falls du ein allgemeines Namensfeld hast
      FROM accounts a
      JOIN invitations i ON (
        (i.sender_id = a.id AND i.receiver_id = ${seglerId}) OR
        (i.receiver_id = a.id AND i.sender_id = ${seglerId})
      )
      WHERE i.status = 'accepted'
    `;

    // Daten für das Frontend formatieren (CamelCase und Namens-Logik)
    const formattedFriends = friends.map((friend: any) => {
      const fullName = `${friend.vorname ?? ""} ${friend.nachname ?? ""}`.trim();
      
      return {
        id: friend.id,
        name: fullName || friend.account_name || friend.email || "Unbekannt",
        email: friend.email,
      };
    });

    return NextResponse.json(formattedFriends);

  } catch (error) {
    console.error("API Error [Friends GET SQL]:", error);
    return NextResponse.json(
      { message: "Fehler beim Laden der Freunde aus der Datenbank" },
      { status: 500 }
    );
  }
}