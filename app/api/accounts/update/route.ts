import fs from "fs";
import path from "path";
import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";

const accountsFile = path.join(process.cwd(), "app/api/accounts/accounts.json");

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, currentPassword, update } = body;

    if (!email || !currentPassword || !update) {
      return NextResponse.json({ success: false, message: "Fehlende Daten" }, { status: 400 });
    }
 
    const accountsData = fs.readFileSync(accountsFile, "utf-8");
    const accounts = JSON.parse(accountsData);

    const userIndex = accounts.findIndex((acc: any) => acc.email === email);
    if (userIndex === -1) {
      return NextResponse.json({ success: false, message: "Benutzer nicht gefunden" }, { status: 404 });
    }

    const user = accounts[userIndex];

    // Passwort prüfen
    const match = await bcrypt.compare(currentPassword, user.passwort);
    if (!match) {
      return NextResponse.json({ success: false, message: "Aktuelles Passwort falsch" }, { status: 401 });
    }

    // Standardfelder aktualisieren
    const commonFields = ["email"];

    const seglerFields = [
      "vorname",
      "nachname",
      "nation",
      "worldSailingId",
      "instagram",
      "tiktok",
      "profilbild",
      "vereine"
    ];
    
    const vereinFields = [
      "name",
      "kuerzel",
      "adresse",
      "stripeAccountId",
      "instagram",   // hinzufügen
      "tiktok",      // hinzufügen
      "profilbild"   // falls du Vereinsbild speichern willst
    ];

    // Gemeinsame Felder
    commonFields.forEach(field => {
      if (update[field] !== undefined) {
        user[field] = update[field];
      }
    });
    
    // Segler-spezifisch
    if (user.type === "segler") {
      seglerFields.forEach(field => {
        if (update[field] !== undefined) {
          user[field] = update[field];
        }
    });
    }
    
    // Verein-spezifisch
    if (user.type === "verein") {
      const vereinFields = [
        "name",
        "kuerzel",
        "adresse",
        "stripeAccountId",
        "instagram",
        "tiktok",
        "profilbild"
      ];
      vereinFields.forEach(field => {
        if (field in update) {
          user[field] = update[field];
        }
      });
    }

    // Stripe-Account-ID hinzufügen (optional)
    if (update.stripeAccountId) {
      user.stripeAccountId = update.stripeAccountId;
    }

    // Passwort nur ändern, wenn angegeben
    if (update.passwort && update.passwort.trim() !== "") {
      user.passwort = await bcrypt.hash(update.passwort, 10);
    }

    // Änderungen speichern
    accounts[userIndex] = user;
    fs.writeFileSync(accountsFile, JSON.stringify(accounts, null, 2), "utf-8");

    return NextResponse.json({ success: true, message: "Profil erfolgreich aktualisiert", user });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false, message: "Fehler beim Aktualisieren" }, { status: 500 });
  }
}
