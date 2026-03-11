import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import sql from '@/lib/db';

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function POST(req: NextRequest) {
  console.log(">>> UPDATE ROUTE TRIGGERED (FRONTEND-KOMPATIBEL) <<<");

  try {
    const body = await req.json().catch(() => ({}));
    
    // FLEXIBLER CHECK: Suche ID im Haupt-Body ODER im update-Objekt
    const id = body.id || (body.update && body.update.id);
    const { currentPassword, update } = body;

    // 1. Pflichtfelder prüfen (mit deinen Statuscodes)
    if (!id) {
      console.log("Fehler: ID nicht gefunden im Payload", body);
      return NextResponse.json({ success: false, message: "ID fehlt" }, { status: 410 });
    }
    if (!currentPassword) {
      return NextResponse.json({ success: false, message: "Passwort fehlt" }, { status: 409 });
    }
    if (!update) {
      return NextResponse.json({ success: false, message: "Update-Daten fehlen" }, { status: 408 });
    }

    // 2. Benutzer suchen
    let user;
    let userType: "segler" | "verein" = "segler";

    const usersSegler = await sql`SELECT * FROM "Segler" WHERE "id" = ${id} LIMIT 1`;
    user = usersSegler[0];

    if (!user) {
      const usersVerein = await sql`SELECT * FROM "Verein" WHERE "id" = ${id} LIMIT 1`;
      user = usersVerein[0];
      userType = "verein";
    }

    if (!user) {
      return NextResponse.json({ success: false, message: "Benutzer nicht gefunden" }, { status: 404 });
    }

    // 3. Passwort prüfen
    const match = await bcrypt.compare(currentPassword, user.passwort);
    if (!match) {
      return NextResponse.json({ success: false, message: "Aktuelles Passwort falsch" }, { status: 401 });
    }

    const now = new Date();

    // 4. Update ausführen (Nur die Profil-Felder, E-Mail/Passwort bleiben geschützt)
    if (userType === "segler") {
      await sql`
        UPDATE "Segler"
        SET 
          "vorname" = ${update.vorname !== undefined ? update.vorname : user.vorname},
          "nachname" = ${update.nachname !== undefined ? update.nachname : user.nachname},
          "worldSailingId" = ${update.worldSailingId !== undefined ? update.worldSailingId : user.worldSailingId},
          "instagram" = ${update.instagram !== undefined ? update.instagram : user.instagram},
          "tiktok" = ${update.tiktok !== undefined ? update.tiktok : user.tiktok},
          "profilbild" = ${update.profilbild !== undefined ? update.profilbild : user.profilbild},
          "updatedAt" = ${now}
        WHERE "id" = ${user.id}
      `;

      // Vereine (A = Segler ID, B = Verein ID)
      if (update.vereine && Array.isArray(update.vereine)) {
        await sql`DELETE FROM "_SeglerVereine" WHERE "A" = ${user.id}`;
        for (const vId of update.vereine) {
          if (vId) await sql`INSERT INTO "_SeglerVereine" ("A", "B") VALUES (${user.id}, ${vId})`;
        }
      }
    } else {
      // UPDATE FÜR VEREIN
      await sql`
        UPDATE "Verein"
        SET 
          "name" = ${update.name !== undefined ? update.name : user.name},
          "kuerzel" = ${update.kuerzel !== undefined ? update.kuerzel : user.kuerzel},
          "adresse" = ${update.adresse !== undefined ? update.adresse : user.adresse},
          "instagram" = ${update.instagram !== undefined ? update.instagram : user.instagram},
          "tiktok" = ${update.tiktok !== undefined ? update.tiktok : user.tiktok},
          "stripeAccountId" = ${update.stripeAccountId !== undefined ? update.stripeAccountId : user.stripeAccountId},
          "profilbild" = ${update.profilbild !== undefined ? update.profilbild : (user.profilbild || null)},
          "updatedAt" = ${now}
        WHERE "id" = ${user.id}
      `;
    }

    // 5. Response
    const reload = userType === "segler"
      ? await sql`SELECT * FROM "Segler" WHERE "id" = ${user.id} LIMIT 1`
      : await sql`SELECT * FROM "Verein" WHERE "id" = ${user.id} LIMIT 1`;
    
    const updatedUser = reload[0];
    const { passwort: _, ...userResponse } = updatedUser;
    
    console.log(`>>> UPDATE ERFOLGREICH: ${userType} ${updatedUser.id} <<<`);
    return NextResponse.json({ success: true, user: userResponse });

  } catch (error: any) {
    console.error("KRITISCHER FEHLER BEIM UPDATE:", error);
    return NextResponse.json({ success: false, message: "Serverfehler" }, { status: 500 });
  }
}