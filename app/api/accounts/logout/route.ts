import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma"; // Umgestellt auf direkten Prisma 7 Export

export const dynamic = "force-dynamic";

export async function POST() {
  try {
    const cookieStore = await cookies();
    const sessionId = cookieStore.get("session_id")?.value;

    // 1. Session in der Neon-Datenbank löschen
    if (sessionId) {
      try {
        await prisma.session.delete({
          where: { id: sessionId },
        });
      } catch (e) {
        // Falls die Session bereits abgelaufen oder gelöscht war, 
        // fangen wir den Fehler ab, damit der Logout-Prozess weiterläuft.
        console.log("Session war in der Datenbank bereits nicht mehr vorhanden.");
      }
    }

    const response = NextResponse.json({ success: true });

    // 2. Cookies im Browser ungültig machen
    // Wir setzen das Ablaufdatum auf den 01.01.1970
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