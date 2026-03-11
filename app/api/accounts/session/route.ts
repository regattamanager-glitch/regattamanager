import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import sql from '@/lib/db';

export const dynamic = "force-dynamic";
export const dynamicParams = true;
export const fetchCache = "force-no-store";

export async function GET() {
  try {
    const cookieStore = await cookies();
    // Prüfung beider Cookie-Varianten
    const sessionId = cookieStore.get("session_id")?.value || cookieStore.get("session")?.value;

    if (!sessionId) {
      return NextResponse.json(null, { status: 401 });
    }

    // 1. Session aus der Neon-Datenbank laden
    const sessions = await sql`SELECT * FROM "Session" WHERE id = ${sessionId} LIMIT 1`;
    const session = sessions[0];

    // 2. Gültigkeit prüfen
    if (!session || new Date(session.expires) < new Date()) {
      return NextResponse.json(null, { status: 401 });
    }

    let user = null;
    let vereine: string[] = [];

    // 3. Daten je nach Nutzertyp laden
    if (session.userType === "verein") {
      const users = await sql`
        SELECT id, name, email, kuerzel, "stripeAccountId" 
        FROM "Verein" 
        WHERE id = ${session.userId} 
        LIMIT 1
      `;
      user = users[0];
    } else {
      // Segler-Basisdaten laden
      const users = await sql`
        SELECT id, vorname, nachname, email, nation, profilbild 
        FROM "Segler" 
        WHERE id = ${session.userId} 
        LIMIT 1
      `;
      user = users[0];

      // WICHTIG: Die Mitgliedschaften aus der Relationstabelle laden
      // Bei Prisma-Legacy-Tabellen ist "A" oft der Segler und "B" der Verein
      if (user) {
        const memberships = await sql`
          SELECT "B" as "clubId" 
          FROM "_SeglerVereine" 
          WHERE "A" = ${user.id}
        `;
        // Wir extrahieren nur die IDs als String-Array
        vereine = memberships.map(m => String(m.clubId));
      }
    }

    if (!user) {
      return NextResponse.json(null, { status: 404 });
    }

    // 4. Kombiniertes Objekt zurückgeben
    return NextResponse.json({
      ...user,
      vereine: vereine, // Dieses Feld fehlte bisher
      type: session.userType
    });

  } catch (error) {
    console.error("Detaillierter Session-Abfrage-Fehler (SQL):", error);
    return NextResponse.json(null, { status: 500 });
  }
}