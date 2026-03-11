import { NextRequest, NextResponse } from "next/server";
import sql from "@/lib/db";
import Stripe from "stripe";
import crypto from "crypto";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { 
  apiVersion: "2022-11-15" as any 
});

export async function POST(req: NextRequest) {
  try {
    const { eventId, klasse, seglerId, extras, skipper, boot, crew } = await req.json();
    const origin = req.headers.get("origin") || process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";

    // 1. Event laden
const eventRows = await sql`SELECT * FROM events WHERE id = ${eventId}`;
if (eventRows.length === 0) throw new Error("Event nicht gefunden");
const event = eventRows[0];

// DIAGNOSE: Was steht in der verein_id?
console.log("Suche Verein mit ID:", event.verein_id);

// 2. Verein laden (Tabellenname "Verein" in Anführungszeichen)
const vereinRows = await sql`SELECT * FROM "Verein" WHERE id = ${event.verein_id}`;

if (vereinRows.length === 0) {
  throw new Error(`Verein mit ID ${event.verein_id} wurde in der Tabelle 'Verein' nicht gefunden.`);
}

const verein = vereinRows[0];

if (!verein.stripeAccountId) { // Vorher: stripe_account_id
  throw new Error("Dieser Verein hat noch kein Stripe-Konto im Regatta Manager hinterlegt.");
}

    // 3. Preisberechnung
    const gebuehren = typeof event.gebuehren_pro_klasse === 'string' 
      ? JSON.parse(event.gebuehren_pro_klasse) 
      : event.gebuehren_pro_klasse;
      
    const basePrice = gebuehren?.[klasse]?.normal || 0;
    const extrasTotal = (extras || []).reduce((sum: number, e: any) => sum + (e.price * e.quantity), 0);
    const serviceFee = (basePrice + extrasTotal) * 0.08;

    // 4. Anmeldung in 'pending_registrations' zwischenspeichern
    const registrationId = crypto.randomUUID();
    await sql`
      INSERT INTO pending_registrations (id, data) 
      VALUES (${registrationId}, ${JSON.stringify({ eventId, klasse, seglerId, extras, skipper, boot, crew })})
    `;

    // 5. Stripe Session erstellen
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card", "sepa_debit"],
      mode: "payment",
      line_items: [
        {
          price_data: {
            currency: "eur",
            product_data: { name: `Regatta: ${event.name} (${klasse})` },
            unit_amount: Math.round(basePrice * 100),
          },
          quantity: 1,
        },
        {
          price_data: {
            currency: "eur",
            product_data: { 
              name: "Service- & Bearbeitungsgebühr",
              description: "Hinweis: 8% Gebühr. Bei Stornierung nicht erstattbar." 
            },
            unit_amount: Math.round(serviceFee * 100),
          },
          quantity: 1,
        },
        // Extras hinzufügen
        ...(extras || []).filter((e: any) => e.quantity > 0).map((e: any) => ({
          price_data: {
            currency: "eur",
            product_data: { name: e.name },
            unit_amount: Math.round(e.price * 100),
          },
          quantity: e.quantity,
        })),
      ],
      payment_intent_data: {
        application_fee_amount: Math.round(serviceFee * 100),
        transfer_data: {
          destination: verein.stripeAccountId, // Vorher: stripe_account_id
        },
      },
      success_url: `${origin}/dashboard/segler/${seglerId}?success=true`,
      cancel_url: `${origin}/dashboard/segler/${seglerId}?canceled=true`,
      metadata: { 
        registrationId, 
        eventId, 
        klasse, 
        seglerId 
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (err: any) {
    console.error("Stripe Session Error:", err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}