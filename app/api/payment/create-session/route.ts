import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import Stripe from "stripe";
import { v4 as uuidv4 } from "uuid"; // Bitte npm install uuid ausführen

export const runtime = "nodejs";
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: "2022-11-15" });

export async function POST(req: NextRequest) {
  try {
    const { eventId, klasse, seglerId, extras, skipper, boot, crew } = await req.json();
    const origin = req.headers.get("origin") || process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";

    // 1. Daten-ID generieren und Backup-Datei speichern (wegen 500 Zeichen Limit)
    const registrationId = uuidv4();
    const tmpDir = path.join(process.cwd(), "data/pending_registrations");
    if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });
    
    fs.writeFileSync(
      path.join(tmpDir, `${registrationId}.json`),
      JSON.stringify({ eventId, klasse, seglerId, extras, skipper, boot, crew })
    );
 
    // 2. Event & Verein laden für Stripe Connect
    const eventsPath = path.join(process.cwd(), "app/api/events/events.json");
    const events = JSON.parse(fs.readFileSync(eventsPath, "utf-8"));
    const event = events.find((e: any) => e.id === eventId);
    
    const accountsPath = path.join(process.cwd(), "app/api/accounts/accounts.json");
    const accounts = JSON.parse(fs.readFileSync(accountsPath, "utf-8"));
    const verein = accounts.find((a: any) => a.id === event.vereinId);

    // 3. Preisberechnung (8% Service Fee)
    const basePrice = event.gebuehrenProKlasse?.[klasse]?.normal || event.gebuehrNormal || 0;
    const extrasTotal = (extras || []).reduce((sum: number, e: any) => sum + (e.price * e.quantity), 0);
    const serviceFee = (basePrice + extrasTotal) * 0.08;

    // 4. Session erstellen
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
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
            product_data: { name: "Service- & Bearbeitungsgebühr" },
            unit_amount: Math.round(serviceFee * 100),
          },
          quantity: 1,
        },
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
        transfer_data: {
          destination: verein.stripeAccountId,
          amount: Math.round((basePrice + extrasTotal) * 100), // Verein bekommt Betrag ohne deine Service Fee
        },
      },
      success_url: `${origin}/dashboard/segler/${seglerId}?success=true`,
      cancel_url: `${origin}/dashboard/segler/${seglerId}?canceled=true`,
      metadata: { registrationId, eventId, klasse, seglerId },
    });

    return NextResponse.json({ url: session.url });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}