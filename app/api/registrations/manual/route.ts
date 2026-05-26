import { NextResponse } from 'next/server';
import sql from "@/lib/db";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { eventId, klasse, skipper, boot, crew, extras } = body;

    let targetSeglerId = skipper.seglerId;

    // 1. Logik: Prüfen, ob ein neuer User angelegt werden muss
    if (!targetSeglerId) {
      // Splitte den Namen in Vor- und Nachname
      const [vorname, ...nachnameParts] = skipper.name.split(' ');
      const nachname = nachnameParts.join(' ');

      const newUser = await sql`
        INSERT INTO users (
          vorname, 
          nachname, 
          email, 
          nation, 
          telefon, 
          "lizenzNummer",
          "isPrivate" -- Dein Wunsch: Nicht als private Person gelistet
        ) VALUES (
          ${vorname},
          ${nachname || ''},
          ${skipper.email || null},
          ${skipper.nation},
          ${skipper.telefon || null},
          ${skipper.lizenzNummer || null},
          true 
        )
        RETURNING id
      `;
      targetSeglerId = newUser[0].id;
    }

    // 2. Speichern der Registrierung
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
        "paymentIntent"
      ) VALUES (
        ${eventId},
        ${targetSeglerId},
        ${klasse},
        ${JSON.stringify(skipper)},
        ${JSON.stringify(boot)},
        ${JSON.stringify(crew || [])},
        ${JSON.stringify(extras || [])},
        NOW(),
        ${'MANUAL_' + Math.random().toString(36).substr(2, 9)}
      )
      RETURNING id
    `;

    return NextResponse.json({ 
      success: true, 
      registrationId: result[0].id 
    });

  } catch (error: any) {
    console.error("Datenbank-Fehler:", error.message);
    return NextResponse.json(
      { error: "DB-Fehler: " + error.message }, 
      { status: 500 }
    );
  }
}