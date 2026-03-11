import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import sql from "@/lib/db";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-12-18.acacia" as any,
});

export async function POST(req: NextRequest) {
  try {
    const { vereinId } = await req.json();
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";

    if (!vereinId) {
      return NextResponse.json({ error: "Keine vereinId übermittelt" }, { status: 400 });
    }

    // 1. Verein laden - Wichtig: Spaltenname in Anführungszeichen wegen Case-Sensitivity
    const vereine = await sql`
      SELECT id, name, email, "stripeAccountId" 
      FROM "Verein" 
      WHERE id = ${vereinId}
    `;
    
    const verein = vereine[0];

    if (!verein) {
      return NextResponse.json({ error: "Verein nicht gefunden" }, { status: 404 });
    }

    let stripeAccountId = verein.stripeAccountId;

    // 2. Falls kein Konto vorhanden -> Erstellen
    if (!stripeAccountId) {
      try {
        const account = await stripe.accounts.create({
          type: "express",
          country: "LU", 
          email: verein.email,
          business_type: "non_profit",
          capabilities: {
            card_payments: { requested: true },
            transfers: { requested: true },
          },
        });

        stripeAccountId = account.id;

        // Wir entfernen "updated_at = NOW()", da die Spalte in deiner DB fehlt
        await sql`
          UPDATE "Verein" 
          SET "stripeAccountId" = ${stripeAccountId} 
          WHERE id = ${vereinId}
        `;
      } catch (stripeErr: any) {
        return NextResponse.json(
          { error: `Stripe-Konfiguration: ${stripeErr.message}` }, 
          { status: 400 }
        );
      }
    }

    // 3. Onboarding-Link generieren
    const accountLink = await stripe.accountLinks.create({
      account: stripeAccountId,
      refresh_url: `${baseUrl}/dashboard/verein/${vereinId}/profil`,
      return_url: `${baseUrl}/dashboard/verein/${vereinId}/profil?stripe_success=true`,
      type: "account_onboarding",
    });

    return NextResponse.json({ url: accountLink.url });

  } catch (err: any) {
    console.error("BACKEND ERROR:", err);

    // Hilfreiche Fehlermeldung bei Datenbank-Problemen
    if (err.message.includes('column "stripeAccountId" does not exist')) {
      return NextResponse.json({ error: "Die Spalte 'stripeAccountId' wurde in der Tabelle 'Verein' nicht gefunden." }, { status: 500 });
    }

    return NextResponse.json(
      { error: "Interner Serverfehler im Backend." },
      { status: 500 }
    );
  }
}