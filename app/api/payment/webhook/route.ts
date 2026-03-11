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

  // 1. Webhook Signatur validieren
  try {
    event = stripe.webhooks.constructEvent(
      body, 
      sig!, 
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err: any) {
    console.error("Webhook Signature Error:", err.message);
    return NextResponse.json({ error: "Webhook Error" }, { status: 400 });
  }

  // 2. Verarbeitung bei erfolgreicher Zahlung
  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const { registrationId, eventId } = session.metadata || {};

    if (!registrationId || !eventId) {
      console.error("❌ Fehlende Metadaten in Stripe Session");
      return NextResponse.json({ received: true });
    }

    try {
      // 3. Daten aus pending_registrations abrufen
      const pendingRows = await sql`
        SELECT data FROM pending_registrations WHERE id = ${registrationId}
      `;

      if (pendingRows.length === 0) {
        console.error("❌ Keine schwebende Anmeldung gefunden für ID:", registrationId);
        return NextResponse.json({ error: "Pending data not found" }, { status: 404 });
      }

      // Daten extrahieren (Neon gibt bei JSONB meist direkt ein Objekt zurück)
      const rawData = pendingRows[0].data;
      const data = typeof rawData === "string" ? JSON.parse(rawData) : rawData;
      
      const { skipper, boot, crew, extras, seglerId, klasse } = data;

      // 4. In die neue 'registrations' Tabelle einfügen
      // Beachte: Wir nutzen "" für CamelCase Spaltennamen in Postgres
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

      // 5. Temporäre Daten aufräumen
      await sql`DELETE FROM pending_registrations WHERE id = ${registrationId}`;

      console.log(`✅ Anmeldung für Segler ${seglerId} (Event: ${eventId}) erfolgreich gespeichert.`);

    } catch (dbError: any) {
      console.error("❌ Datenbank-Fehler im Webhook:", dbError.message);
      // Wir geben 500 zurück, damit Stripe den Webhook ggf. erneut sendet
      return NextResponse.json({ error: "Database update failed" }, { status: 500 });
    }
  }

  return NextResponse.json({ received: true });
}