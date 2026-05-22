import { NextRequest, NextResponse } from "next/server";
import sql from "@/lib/db";
import crypto from "crypto";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { eventId, klasse, seglerId, skipper, boot, crew } = body;

    if (!eventId || !skipper || !boot) {
      return NextResponse.json({ success: false, message: "Unvollständige Daten" }, { status: 400 });
    }

    // 1. Event laden, um Paywall-Status zu prüfen
    const eventRows = await sql`SELECT "isPaywallActive" FROM events WHERE id = ${eventId}`;
    if (eventRows.length === 0) {
      return NextResponse.json({ success: false, message: "Event nicht gefunden" }, { status: 404 });
    }
    
    const event = eventRows[0];
    if (event.isPaywallActive === true) {
      return NextResponse.json({ 
        success: false, 
        message: "Dieses Event ist zahlungspflichtig." 
      }, { status: 403 });
    }

    // 2. In die gleiche Tabelle wie der Webhook schreiben (registrations)
    // Wir nutzen hier die gleiche Struktur wie im Webhook-Handler
    await sql`
      INSERT INTO registrations (
        "seglerId", 
        "eventId", 
        "klasse", 
        "skipper", 
        "boot", 
        "crew", 
        "paidAt"
      ) VALUES (
        ${seglerId || null}, 
        ${eventId}, 
        ${klasse}, 
        ${JSON.stringify(skipper)}, 
        ${JSON.stringify(boot)}, 
        ${JSON.stringify(crew)}, 
        NOW()
      )
    `;

    return NextResponse.json({ success: true, message: "Anmeldung erfolgreich." });

  } catch (error: any) {
    console.error("KRITISCHER FEHLER:", error);
    return NextResponse.json({ success: false, message: "Serverfehler" }, { status: 500 });
  }
}