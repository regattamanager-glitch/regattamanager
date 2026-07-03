import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import sql from "@/lib/db";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2022-11-15" as any,
});

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = req.headers.get("stripe-signature");
  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, sig!, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch (err: any) {
    console.error("❌ Signatur Fehler:", err.message);
    return NextResponse.json({ error: "Webhook Error" }, { status: 400 });
  }

  // Sofort filtern
  if (event.type !== "checkout.session.completed") {
    return NextResponse.json({ received: true });
  }

  const session = event.data.object as Stripe.Checkout.Session;
  const { registrationId, eventId } = session.metadata || {};

  if (!registrationId || !eventId) {
    console.error("❌ Keine Metadaten in der Session gefunden!");
    return NextResponse.json({ received: true });
  }

  try {
    
    // 1. Daten abrufen
    const pendingRows = await sql`
      SELECT data FROM pending_registrations WHERE id = ${registrationId}
    `;

    if (pendingRows.length === 0) {
      console.warn("⚠️ ID nicht gefunden. Wurde die Zahlung eventuell schon verarbeitet?");
      return NextResponse.json({ received: true });
    }

    const rawData = pendingRows[0].data;
    const data = typeof rawData === "string" ? JSON.parse(rawData) : rawData;
    const { skipper, boot, crew, extras, seglerId, klasse } = data;

    // 2. In finale Tabelle einfügen
    await sql`
      INSERT INTO registrations (
        "seglerId", 
        "eventId", 
        "klasse", 
        "skipper", 
        "boot", 
        "crew", 
        "extras", 
        "paidAt", 
        "paymentIntent"
      ) VALUES (
        ${seglerId}, 
        ${eventId}, 
        ${klasse}, 
        ${JSON.stringify(skipper)}, 
        ${JSON.stringify(boot)}, 
        ${JSON.stringify(crew)}, 
        ${JSON.stringify(extras)}, 
        NOW(), 
        ${session.payment_intent as string}
      )
    `;

    // 3. Aus pending_registrations löschen
    await sql`DELETE FROM pending_registrations WHERE id = ${registrationId}`;

    return NextResponse.json({ received: true });

  } catch (dbError: any) {
    console.error("❌ Datenbank-Fehler:", dbError.message);
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }
}