import { randomUUID } from "crypto";
import { cookies, headers } from "next/headers";
import { NextResponse } from "next/server";
import sql from '@/lib/db';

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const { email, code } = body;

    if (!email || !code) {
      return NextResponse.json({ success: false, message: "Fehlende Daten" }, { status: 400 });
    }

    // 1. Code in der Neon-Datenbank suchen
    const entries = await sql`
      SELECT * FROM "LoginCode" 
      WHERE email = ${email} AND code = ${code} 
      LIMIT 1
    `;
    const entry = entries[0];

    if (!entry || new Date(entry.expires) < new Date()) {
      return NextResponse.json({ success: false, message: "Code ungültig oder abgelaufen" }, { status: 401 });
    }

    // 2. Nutzer suchen und Typ bestimmen
    let userResult = await sql`SELECT * FROM "Segler" WHERE email = ${email} LIMIT 1`;
    let user = userResult[0];
    let userType: "segler" | "verein" = "segler";

    if (!user) {
      userResult = await sql`SELECT * FROM "Verein" WHERE email = ${email} LIMIT 1`;
      user = userResult[0];
      userType = "verein";
    }

    if (!user) {
      return NextResponse.json({ success: false, message: "Benutzer nicht gefunden" }, { status: 404 });
    }

    // 3. Alten Code löschen (Cleanup nach Erfolg)
    await sql`DELETE FROM "LoginCode" WHERE id = ${entry.id}`;
    await sql`
      DELETE FROM "Session" 
      WHERE "userId" = ${user.id} AND "userType" = ${userType}
    `;

    // 4. Session-Daten vorbereiten
    const sessionId = randomUUID();
    const h = await headers();
    const ua = h.get("user-agent") ?? "unknown";
    const ip = h.get("x-forwarded-for")?.split(',')[0] ?? h.get("x-real-ip") ?? "unknown";
    const expires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 Tage

    // 5. Session in PostgreSQL erstellen (Wichtig: Spaltennamen in Anführungszeichen)
    await sql`
      INSERT INTO "Session" (id, "userId", "userType", "userAgent", ip, expires)
      VALUES (${sessionId}, ${user.id}, ${userType}, ${ua}, ${ip}, ${expires})
    `;

    // 6. Cookies & Response vorbereiten
    const isProd = process.env.NODE_ENV === "production";
    
    // Wir erstellen zuerst das Response-Objekt
    const response = NextResponse.json({ 
      success: true, 
      type: userType, 
      id: user.id 
    });

    const cookieOptions = { 
      httpOnly: true, 
      secure: isProd, // WICHTIG: Muss auf Vercel (HTTPS) true sein
      sameSite: "lax" as const, 
      path: "/", 
      maxAge: 7 * 24 * 60 * 60 // 7 Tage
    };

    // Wir hängen die Cookies direkt an dieses spezifische Response-Objekt
    response.cookies.set("session_id", sessionId, cookieOptions);
    response.cookies.set("session", sessionId, cookieOptions);

    // Erst jetzt geben wir die Response inklusive der Set-Cookie-Header zurück
    return response;

  } catch (error) {
    console.error("Detaillierter Verifizierungsfehler (SQL):", error);
    return NextResponse.json({ success: false, message: "Serverfehler bei der Verifizierung" }, { status: 500 });
  }
}
