// app/api/accounts/update/route.ts
import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma"; // Dein Prisma-Client

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, currentPassword, update } = body;

    if (!email || !currentPassword || !update) {
      return NextResponse.json({ success: false, message: "Fehlende Daten" }, { status: 400 });
    }

    // Benutzer laden
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return NextResponse.json({ success: false, message: "Benutzer nicht gefunden" }, { status: 404 });
    }

    // Passwort prüfen
    const match = await bcrypt.compare(currentPassword, user.passwort);
    if (!match) {
      return NextResponse.json({ success: false, message: "Aktuelles Passwort falsch" }, { status: 401 });
    }

    // Felder vorbereiten
    const commonFields: any = {};
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
      "instagram",
      "tiktok",
      "profilbild"
    ];

    // Gemeinsame Felder updaten
    if (update.email) commonFields.email = update.email;

    // Typ-spezifische Felder
    if (user.type === "segler") {
      seglerFields.forEach(f => { if (update[f] !== undefined) commonFields[f] = update[f]; });
    }
    if (user.type === "verein") {
      vereinFields.forEach(f => { if (update[f] !== undefined) commonFields[f] = update[f]; });
    }

    // Passwort optional ändern
    if (update.passwort && update.passwort.trim() !== "") {
      commonFields.passwort = await bcrypt.hash(update.passwort, 10);
    }

    // Update ausführen
    const updatedUser = await prisma.user.update({
      where: { email },
      data: commonFields
    });

    return NextResponse.json({
      success: true,
      message: "Profil erfolgreich aktualisiert",
      user: updatedUser
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false, message: "Fehler beim Aktualisieren" }, { status: 500 });
  }
}