import { cookies } from "next/headers";
import { NextResponse } from "next/server";
// Umgestellt auf den direkten Prisma 7 Export
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

export async function GET() {
  try {
    const cookieStore = await cookies();
    // Wir prüfen beide Varianten, falls du im Frontend mal wechselst
    const sessionId = cookieStore.get("session_id")?.value || cookieStore.get("session")?.value;

    if (!sessionId) {
      return NextResponse.json(null, { status: 401 });
    }

    // 1. Session aus der Neon-Datenbank laden
    const session = await prisma.session.findUnique({ 
      where: { id: sessionId } 
    });

    // 2. Gültigkeit prüfen
    if (!session || session.expires < new Date()) {
      return NextResponse.json(null, { status: 401 });
    }

    // 3. Den passenden Nutzer laden
    let user = null;
    if (session.userType === "verein") {
      user = await prisma.verein.findUnique({ 
        where: { id: session.userId },
        // Passwort explizit ausschließen!
        select: { 
          id: true, 
          name: true, 
          email: true, 
          kuerzel: true,
          stripeAccountId: true 
        } 
      });
    } else {
      user = await prisma.segler.findUnique({ 
        where: { id: session.userId },
        select: { 
          id: true, 
          vorname: true, 
          nachname: true, 
          email: true, 
          nation: true,
          profilbild: true 
        }
      });
    }

    if (!user) {
      return NextResponse.json(null, { status: 404 });
    }

    // 4. Daten zurückgeben (inkl. Typ für das Frontend)
    return NextResponse.json({
      ...user,
      type: session.userType
    });

  } catch (error) {
    console.error("Detaillierter Session-Abfrage-Fehler:", error);
    return NextResponse.json(null, { status: 500 });
  }
}