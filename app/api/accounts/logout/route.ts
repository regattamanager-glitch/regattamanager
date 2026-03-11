import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import sql from '@/lib/db';

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

export async function POST() {
  try {
    const cookieStore = await cookies();
    const sessionId = cookieStore.get("session_id")?.value;

    // 1. Session in der Neon-Datenbank löschen
    if (sessionId) {
      // DELETE in SQL wirft keinen Fehler, wenn die ID nicht gefunden wird.
      // Es werden dann einfach 0 Zeilen gelöscht.
      await sql`DELETE FROM "Session" WHERE id = ${sessionId}`;
    }

    const response = NextResponse.json({ success: true });

    // 2. Cookies im Browser ungültig machen
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax" as const,
      expires: new Date(0),
      path: "/",
    };

    response.cookies.set("session", "", cookieOptions);
    response.cookies.set("session_id", "", cookieOptions);

    return response;
  } catch (error) {
    console.error("Detaillierter Logout-Fehler:", error);
    return NextResponse.json({ success: false, message: "Serverfehler beim Logout" }, { status: 500 });
  }
}