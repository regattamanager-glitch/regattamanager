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

    // Wir speichern die Objekte direkt als JSON, da deine Spalten "jsonb" sind
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
        ${skipper.seglerId || null},
        ${klasse},
        ${JSON.stringify(skipper)},
        ${JSON.stringify(boot)},
        ${JSON.stringify(crew || [])},
        ${JSON.stringify(extras || [])},
        NOW(),
        ${'MANUAL_' + Math.random().toString(36).substr(2, 9)} -- Dummy ID für manuelle Buchung
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