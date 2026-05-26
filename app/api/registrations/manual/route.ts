import { NextResponse } from 'next/server';
import sql from "@/lib/db";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { 
      eventId, 
      klasse, 
      skipper, 
      boot, 
      crew, 
      extras 
    } = body;

    // 1. Prüfen, ob eine seglerId vorhanden ist. Wenn nicht, neuen User in der Tabelle 'users' anlegen.
    // Hinweis: Falls deine Tabelle anders heißt (z.B. "Users"), passe den Namen hier an.
    let targetSeglerId = skipper.seglerId;

    if (!targetSeglerId || targetSeglerId === "") {
      const nameParts = skipper.name ? skipper.name.split(' ') : ["", ""];
      const vorname = nameParts[0];
      const nachname = nameParts.slice(1).join(' ');

      const newUser = await sql`
        INSERT INTO users (
          vorname, 
          nachname, 
          email, 
          nation, 
          telefon, 
          "lizenzNummer"
        ) VALUES (
          ${vorname},
          ${nachname},
          ${skipper.email || null},
          ${skipper.nation || 'DE'},
          ${skipper.telefon || null},
          ${skipper.lizenzNummer || null}
        )
        RETURNING id
      `;
      targetSeglerId = newUser[0].id;
    }

    // 2. Registrierung in der Datenbank speichern
    const result = await sql`
      INSERT INTO registrations (
        "eventId",
        "seglerId",
        "klasse",
        "skipper",
        "boot",
        "crew",
        "extras",
        "paidAt",
        "paymentIntent",
        "status"
      ) VALUES (
        ${eventId},
        ${targetSeglerId},
        ${klasse},
        ${JSON.stringify(skipper)},
        ${JSON.stringify(boot)},
        ${JSON.stringify(crew || [])},
        ${JSON.stringify(extras || [])},
        NOW(),
        ${'MANUAL_' + Math.random().toString(36).substr(2, 9)},
        'PAID'
      )
      RETURNING id
    `;

    return NextResponse.json({ 
      success: true, 
      registrationId: result[0].id 
    });

  } catch (error: any) {
    console.error("API-Fehler bei manueller Registrierung:", error);
    return NextResponse.json(
      { error: "DB-Fehler: " + error.message }, 
      { status: 500 }
    );
  }
}