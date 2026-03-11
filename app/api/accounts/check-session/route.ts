import { NextResponse } from "next/server";
import sql from '@/lib/db';

export const dynamic = "force-dynamic";
export const dynamicParams = true;
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
    // Wir nutzen Anführungszeichen bei "Session", da PostgreSQL Großschreibung oft so erzwingt
    const sessions = await sql`SELECT * FROM "Session" WHERE id = ${sessionId} LIMIT 1`;
    const session = sessions[0];

    // 3. Gültigkeit prüfen
    if (!session || new Date(session.expires) < new Date()) {
      return NextResponse.json({ ok: false, error: "Session abgelaufen" }, { status: 401 });
    }

    // 4. User-Daten laden basierend auf userType
    let user = null;
    if (session.userType === "verein") {
      const users = await sql`SELECT * FROM "Verein" WHERE id = ${session.userId} LIMIT 1`;
      user = users[0];
    } else {
      const users = await sql`SELECT * FROM "Segler" WHERE id = ${session.userId} LIMIT 1`;
      user = users[0];
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
        name: session.userType === "verein" 
          ? user.name 
          : `${user.vorname} ${user.nachname}`,
        role: session.userType 
      } 
    });

  } catch (e) {
    console.error("Fehler bei Session-Check:", e);
    return NextResponse.json({ ok: false, error: "Serverfehler" }, { status: 500 });
  }
}