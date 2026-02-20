import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import fs from "fs";
import path from "path";

export const runtime = "nodejs";

// HIER FEHLTE DIE INITIALISIERUNG:
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2022-11-15", // Oder deine genutzte Version
});

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = req.headers.get("stripe-signature");
  let event: Stripe.Event;

  try {
    // Jetzt ist 'stripe' (kleingeschrieben) definiert
    event = stripe.webhooks.constructEvent(
      body, 
      sig!, 
      process.env.STRIPE_WEBHOOK_SECRET!
    ); 
  } catch (err: any) {
    console.error("Webhook Signature Error:", err.message);
    return NextResponse.json({ error: "Webhook Error" }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const { registrationId, eventId, klasse } = session.metadata || {};

    if (!registrationId) {
        console.error("Keine registrationId in Metadata gefunden");
        return NextResponse.json({ received: true });
    }

    const filePath = path.join(process.cwd(), "data/pending_registrations", `${registrationId}.json`);
    
    if (!fs.existsSync(filePath)) {
        console.error("Datei nicht gefunden:", filePath);
        return NextResponse.json({ error: "Data not found" }, { status: 404 });
    }

    const rawData = JSON.parse(fs.readFileSync(filePath, "utf-8"));
    const { skipper, boot, crew, extras } = rawData;

    const geburtsdatum = (skipper.geburtsJahr && skipper.geburtsMonat && skipper.geburtsTag)
      ? `${skipper.geburtsJahr}-${skipper.geburtsMonat.padStart(2, '0')}-${skipper.geburtsTag.padStart(2, '0')}`
      : "";

    const registrationData = {
      skipper: {
      seglerId: rawData.seglerId,
      name: skipper.name,
      nation: skipper.nation,
      email: skipper.email,
      telefon: skipper.telefon || "",
      verein: skipper.verein || "",
      geburtsdatum,
      lizenzNummer: skipper.lizenzNummer || ""
      },
      boot,
      crew,
      extras: (extras || []).filter((e: any) => e.quantity > 0),
      bezahlt: true,
      paidAt: new Date().toISOString(),
      paymentIntent: session.payment_intent
    };

    try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/events`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: eventId,
            action: "register",
            data: registrationData,
          }),
        });

        if (res.ok) {
            fs.unlinkSync(filePath);
            console.log("✅ Registrierung erfolgreich verarbeitet und Temp-Datei gelöscht.");
        } else {
            console.error("❌ Fehler beim Update der events.json:", await res.text());
        }
    } catch (error) {
        console.error("❌ API Fetch Error im Webhook:", error);
    }
  }

  return NextResponse.json({ received: true });
}