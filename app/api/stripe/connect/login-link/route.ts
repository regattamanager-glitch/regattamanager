import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import sql from "@/lib/db";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-12-18.acacia" as any,
});

export async function POST(req: NextRequest) {
  try {
    const { vereinId } = await req.json();

    const result = await sql`
      SELECT "stripeAccountId" FROM "Verein" WHERE id = ${vereinId}
    `;
    
    const stripeAccountId = result[0]?.stripeAccountId;

    if (!stripeAccountId) {
      return NextResponse.json({ error: "Kein Stripe-Konto verknüpft" }, { status: 400 });
    }

    // 1. Zuerst den Account-Status von Stripe abrufen
    const account = await stripe.accounts.retrieve(stripeAccountId);

    // 2. Prüfen, ob das Onboarding abgeschlossen ist
    if (!account.details_submitted) {
      return NextResponse.json({ 
        error: "ONBOARDING_INCOMPLETE",
        message: "Das Onboarding wurde noch nicht abgeschlossen." 
      }, { status: 403 }); 
    }

    // 3. Nur wenn Onboarding fertig ist, den Login-Link erstellen
    const loginLink = await stripe.accounts.createLoginLink(stripeAccountId);

    return NextResponse.json({ url: loginLink.url });
  } catch (err: any) {
    console.error("Stripe Login Link Error:", err);
    
    // Spezifische Behandlung für den Fall, dass Stripe den Link verweigert
    if (err.message.includes("onboarding")) {
       return NextResponse.json({ error: "ONBOARDING_INCOMPLETE" }, { status: 403 });
    }

    return NextResponse.json({ error: "Fehler beim Erstellen des Login-Links" }, { status: 500 });
  }
}