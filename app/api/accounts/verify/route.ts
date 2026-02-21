import { randomUUID } from "crypto";
import { cookies, headers } from "next/headers";
import { NextResponse } from "next/server";
// Import auf 'db' korrigiert
import db from "@/lib/prisma"; 

export async function POST(req: Request) {
  try {
    const { email, code } = await req.json();
    if (!email || !code) {
      return NextResponse.json({ success: false, message: "Fehlende Daten" }, { status: 400 });
    }

    // 1. Code in der Datenbank suchen
    const entry = await db.loginCode.findFirst({
      where: { email, code },
    });

    if (!entry || entry.expires < new Date()) {
      return NextResponse.json({ success: false, message: "Code ungültig oder abgelaufen" }, { status: 401 });
    }

    // 2. Nutzer suchen und Typ bestimmen
    let user: any = await db.segler.findUnique({ where: { email } });
    let userType: "segler" | "verein" = "segler";

    if (!user) {
      user = await db.verein.findUnique({ where: { email } });
      userType = "verein";
    }

    if (!user) {
      return NextResponse.json({ success: false, message: "Benutzer nicht gefunden" }, { status: 404 });
    }

    // 3. Alten Code löschen (Cleanup)
    await db.loginCode.delete({ where: { id: entry.id } });

    // 4. Session-Daten vorbereiten
    const sessionId = randomUUID();
    const h = await headers();
    const ua = h.get("user-agent") ?? "unknown";
    // IP Adresse ermitteln
    const ip = h.get("x-forwarded-for")?.split(',')[0] ?? h.get("x-real-ip") ?? "unknown";

    // 5. Session in der Datenbank (PostgreSQL) erstellen
    await db.session.create({
      data: {
        id: sessionId,
        userId: user.id,
        userType: userType, // Wichtig für deine Logik
        userAgent: ua,
        ip: ip,
        expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 Tage gültig
      },
    });

    // 6. Cookie setzen
    const cookieStore = await cookies();
    cookieStore.set("session_id", sessionId, { 
      httpOnly: true, 
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax", 
      path: "/", 
      maxAge: 7 * 24 * 60 * 60 
    });

    // Auch den alten Cookie-Namen 'session' zur Kompatibilität setzen
    cookieStore.set("session", sessionId, { 
      httpOnly: true, 
      path: "/", 
      maxAge: 7 * 24 * 60 * 60 
    });

    return NextResponse.json({ 
      success: true, 
      type: userType, 
      id: user.id 
    });

  } catch (error) {
    console.error("Verifizierungsfehler:", error);
    return NextResponse.json({ success: false, message: "Serverfehler" }, { status: 500 });
  }
}