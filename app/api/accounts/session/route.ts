import { cookies } from "next/headers";
import { NextResponse } from "next/server";
// Import auf 'db' korrigiert
import { getPrisma } from "@/lib/prisma";
import { PrismaClient } from '@prisma/client';

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const db = getPrisma();
    const cookieStore = await cookies();
    // Prüfe beide gängigen Cookie-Namen zur Sicherheit
    const sessionId = cookieStore.get("session")?.value || cookieStore.get("session_id")?.value;

    if (!sessionId) {
      return NextResponse.json(null, { status: 401 });
    }

    // 1. Session aus der Datenbank laden
    const session = await db.session.findUnique({ 
      where: { id: sessionId } 
    });

    // 2. Prüfen, ob Session existiert und noch gültig ist
    if (!session || session.expires < new Date()) {
      return NextResponse.json(null, { status: 401 });
    }

    // 3. Den passenden Nutzer laden (basierend auf userType aus deinem Schema)
    let user = null;
    if (session.userType === "verein") {
      user = await db.verein.findUnique({ 
        where: { id: session.userId },
        select: { id: true, name: true, email: true, kuerzel: true } // Passwort niemals mitsenden!
      });
    } else {
      user = await db.segler.findUnique({ 
        where: { id: session.userId },
        select: { id: true, vorname: true, nachname: true, email: true, nation: true }
      });
    }

    if (!user) {
      return NextResponse.json(null, { status: 404 });
    }

    // 4. Benutzerdaten mit Typ-Information zurückgeben
    return NextResponse.json({
      ...user,
      type: session.userType
    });

  } catch (error) {
    console.error("Session-Fehler:", error);
    return NextResponse.json(null, { status: 500 });
  }
}