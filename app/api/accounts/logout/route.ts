import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import db from "@/lib/prisma"; // Import für die Datenbank-Interaktion

export async function POST() {
  try {
    const cookieStore = await cookies();
    const sessionId = cookieStore.get("session_id")?.value;

    // 1. Session in der Datenbank löschen, falls vorhanden
    if (sessionId) {
      try {
        await db.session.delete({
          where: { id: sessionId },
        });
      } catch (e) {
        // Falls die Session schon weg ist oder nicht existiert, ignorieren wir den Fehler
        console.log("Session existierte bereits nicht mehr in der DB.");
      }
    }

    const response = NextResponse.json({ success: true });

    // 2. Cookies im Browser löschen (Sowohl 'session' als auch 'session_id')
    const cookieOptions = {
      httpOnly: true,
      expires: new Date(0),
      path: "/",
    };

    response.cookies.set("session", "", cookieOptions);
    response.cookies.set("session_id", "", cookieOptions);

    return response;
  } catch (error) {
    console.error("Logout Fehler:", error);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}