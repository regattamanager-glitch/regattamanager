import { NextRequest, NextResponse } from "next/server";
import fs from 'fs';
import path from 'path';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: seglerId } = await params;

    const accountsPath = path.join(
      process.cwd(),
      "app/api/accounts/accounts.json"
    );

    if (!fs.existsSync(accountsPath)) {
      return NextResponse.json([]);
    }

    const accounts = JSON.parse(
      fs.readFileSync(accountsPath, "utf8")
    );

    // 1️⃣ aktuellen Segler finden
    const myAccount = accounts.find(
      (a: any) => String(a.id) === String(seglerId)
    );

    if (!myAccount || !myAccount.friends) {
      return NextResponse.json([]);
    }
 
    // 2️⃣ Freunde auflösen
    const friends = myAccount.friends
      .map((friendId: string) =>
        accounts.find((a: any) => String(a.id) === String(friendId))
      )
      .filter(Boolean)
      .map((friend: any) => ({
        id: friend.id,
        name:
          `${friend.vorname ?? ""} ${friend.nachname ?? ""}`.trim() ||
          friend.email ||
          "Unbekannt",
        email: friend.email,
      }));

    return NextResponse.json(friends);

  } catch (error) {
    console.error("API Error [Friends GET]:", error);
    return NextResponse.json(
      { message: "Fehler beim Laden der Freunde" },
      { status: 500 }
    );
  }
}