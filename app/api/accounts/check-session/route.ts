import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma"; // Umgestellt auf direkten Export

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

export async function POST(req: Request) {
  try {
    // 1. Daten aus dem Request holen
    const body = await req.json().catch(() => ({}));
    const { sessionId } = body;

    if (!sessionId) {
      return NextResponse.json({ ok: false, error: "Keine Session-ID" }, { status: 400 });
    }

    // 2. Session in der Neon-Datenbank suchen
    const session = await prisma.session.findUnique({
      where: { id: sessionId },
    });

    // 3. Gültigkeit prüfen (In deinem Schema heißt das Feld 'expires')
    if (!session || session.expires < new Date()) {
      return NextResponse.json({ ok: false, error: "Session abgelaufen" }, { status: 401 });
    }

    // 4. User-Daten laden basierend auf userType
    let user = null;
    if (session.userType === "verein") {
      user = await prisma.verein.findUnique({ 
        where: { id: session.userId } 
      });
    } else {
      user = await prisma.segler.findUnique({ 
        where: { id: session.userId } 
      });
    }

    // 5. Falls Session existiert, aber User gelöscht wurde
    if (!user) {
      return NextResponse.json({ ok: false, error: "Nutzer nicht gefunden" }, { status: 401 });
    }

    // 6. Erfolg: Daten strukturiert zurückgeben
    return NextResponse.json({ 
      ok: true, 
      user: { 
        id: user.id, 
        // Dynamische Namensbildung für Verein vs. Segler
        name: session.userType === "verein" 
          ? (user as any).name 
          : `${(user as any).vorname} ${(user as any).nachname}`,
        role: session.userType 
      } 
    });

  } catch (e) {
    console.error("Fehler bei Session-Check:", e);
    return NextResponse.json({ ok: false, error: "Serverfehler" }, { status: 500 });
  }
}