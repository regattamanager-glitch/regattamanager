import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import fs from "fs/promises";
import path from "path";

// Stripe initialisieren
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2022-11-15",
});

// Pfad zur JSON-Datei mit Vereinsdaten
const accountsPath = path.join(process.cwd(), "app/api/accounts/accounts.json");

export async function POST(req: NextRequest) {
  try {
    const { vereinId } = await req.json();
    if (!vereinId) {
      return NextResponse.json({ error: "vereinId fehlt" }, { status: 400 });
    }

    // JSON-Datei einlesen
    const data = await fs.readFile(accountsPath, "utf-8");
    const accounts = JSON.parse(data);

    // Verein suchen
    const verein = accounts.find((a: any) => a.id === vereinId); 
    if (!verein) {
      return NextResponse.json({ error: "Verein nicht gefunden" }, { status: 404 });
    }

    // Wenn bereits Stripe-Konto existiert → neuen AccountLink erstellen
    if (verein.stripeAccountId) {
      const link = await stripe.accountLinks.create({
        account: verein.stripeAccountId,
        refresh_url: `${process.env.NEXT_PUBLIC_BASE_URL}/dashboard/verein`,
        return_url: `${process.env.NEXT_PUBLIC_BASE_URL}/dashboard/verein`,
        type: "account_onboarding",
      });

      return NextResponse.json({ url: link.url, stripeAccountId: verein.stripeAccountId });
    }

    // Neues Stripe Express Konto erstellen
    const account = await stripe.accounts.create({
      type: "express",
      country: "LU",
      business_type: "non_profit",
      capabilities: { transfers: { requested: true } },
    });

    // Daten im JSON-File speichern
    verein.stripeAccountId = account.id;
    verein.stripeStatus = "pending";

    await fs.writeFile(accountsPath, JSON.stringify(accounts, null, 2));

    // AccountLink erzeugen, um Onboarding durchzuführen
    const link = await stripe.accountLinks.create({
      account: account.id,
      refresh_url: `${process.env.NEXT_PUBLIC_BASE_URL}/dashboard/verein`,
      return_url: `${process.env.NEXT_PUBLIC_BASE_URL}/dashboard/verein`,
      type: "account_onboarding",
    });

    // Erfolgreiche Antwort zurückgeben
    return NextResponse.json({ url: link.url, stripeAccountId: account.id });
  } catch (err) {
    console.error("Stripe Connect Fehler:", err);
    return NextResponse.json(
      { error: "Fehler beim Erstellen oder Verbinden des Stripe-Kontos" },
      { status: 500 }
    );
  }
}
