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

    // Erstellt einen einmaligen Link zum Stripe Express Dashboard
    const loginLink = await stripe.accounts.createLoginLink(stripeAccountId);

    return NextResponse.json({ url: loginLink.url });
  } catch (err: any) {
    console.error("Stripe Login Link Error:", err);
    return NextResponse.json({ error: "Fehler beim Erstellen des Login-Links" }, { status: 500 });
  }
}