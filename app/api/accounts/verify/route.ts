import { randomUUID } from "crypto";
import { cookies, headers } from "next/headers";
import { NextResponse } from "next/server";
// Umgestellt auf den direkten Prisma 7 Export
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const { email, code } = body;

    if (!email || !code) {
      return NextResponse.json({ success: false, message: "Fehlende Daten" }, { status: 400 });
    }

    // 1. Code in der Neon-Datenbank suchen
    const entry = await prisma.loginCode.findFirst({
      where: { email, code },
    });

    if (!entry || entry.expires < new Date()) {
      return NextResponse.json({ success: false, message: "Code ungültig oder abgelaufen" }, { status: 401 });
    }

    // 2. Nutzer suchen und Typ bestimmen
    let user: any = await prisma.segler.findUnique({ where: { email } });
    let userType: "segler" | "verein" = "segler";

    if (!user) {
      user = await prisma.verein.findUnique({ where: { email } });
      userType = "verein";
    }

    if (!user) {
      return NextResponse.json({ success: false, message: "Benutzer nicht gefunden" }, { status: 404 });
    }

    // 3. Alten Code löschen (Cleanup nach Erfolg)
    await prisma.loginCode.delete({ where: { id: entry.id } });

    // 4. Session-Daten vorbereiten
    const sessionId = randomUUID();
    const h = await headers();
    const ua = h.get("user-agent") ?? "unknown";
    const ip = h.get("x-forwarded-for")?.split(',')[0] ?? h.get("x-real-ip") ?? "unknown";

    // 5. Session in PostgreSQL erstellen
    await prisma.session.create({
      data: {
        id: sessionId,
        userId: user.id,
        userType: userType,
        userAgent: ua,
        ip: ip,
        expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 Tage
      },
    });

    // 6. Cookies setzen
    const cookieStore = await cookies();
    const cookieOptions = { 
      httpOnly: true, 
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax" as const, 
      path: "/", 
      maxAge: 7 * 24 * 60 * 60 
    };

    cookieStore.set("session_id", sessionId, cookieOptions);
    cookieStore.set("session", sessionId, cookieOptions);

    return NextResponse.json({ 
      success: true, 
      type: userType, 
      id: user.id 
    });

  } catch (error) {
    console.error("Detaillierter Verifizierungsfehler (Prisma):", error);
    return NextResponse.json({ success: false, message: "Serverfehler bei der Verifizierung" }, { status: 500 });
  }
}