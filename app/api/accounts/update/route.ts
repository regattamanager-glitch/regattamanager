import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
// Import auf 'db' korrigiert
import { getPrisma } from "@/lib/prisma";
import { PrismaClient } from '@prisma/client';

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const db = getPrisma();
    const body = await req.json();
    const { email, currentPassword, update } = body;

    if (!email || !currentPassword || !update) {
      return NextResponse.json({ success: false, message: "Fehlende Daten" }, { status: 400 });
    }

    // 1. Benutzer suchen (entweder in Segler oder Verein)
    let user: any = await db.segler.findUnique({ where: { email } });
    let userType: "segler" | "verein" = "segler";

    if (!user) {
      user = await db.verein.findUnique({ where: { email } });
      userType = "verein";
    }

    if (!user) {
      return NextResponse.json({ success: false, message: "Benutzer nicht gefunden" }, { status: 404 });
    }

    // 2. Passwort prüfen
    const match = await bcrypt.compare(currentPassword, user.passwort);
    if (!match) {
      return NextResponse.json({ success: false, message: "Aktuelles Passwort falsch" }, { status: 401 });
    }

    // 3. Felder vorbereiten
    const updateData: any = {};

    // Passwort optional ändern
    if (update.passwort && update.passwort.trim() !== "") {
      updateData.passwort = await bcrypt.hash(update.passwort, 10);
    }

    // Email optional ändern
    if (update.email) updateData.email = update.email;

    // 4. Typ-spezifische Updates
    if (userType === "segler") {
      const seglerFields = ["vorname", "nachname", "nation", "worldSailingId", "instagram", "tiktok", "profilbild"];
      seglerFields.forEach(f => {
        if (update[f] !== undefined) updateData[f] = update[f];
      });

      const updatedSegler = await db.segler.update({
        where: { email },
        data: updateData
      });

      return NextResponse.json({ success: true, user: updatedSegler });
    } else {
      const vereinFields = ["name", "kuerzel", "adresse", "stripeAccountId", "instagram", "tiktok"];
      vereinFields.forEach(f => {
        if (update[f] !== undefined) updateData[f] = update[f];
      });

      const updatedVerein = await db.verein.update({
        where: { email },
        data: updateData
      });

      return NextResponse.json({ success: true, user: updatedVerein });
    }

  } catch (error) {
    console.error("Update Fehler:", error);
    return NextResponse.json({ success: false, message: "Fehler beim Aktualisieren" }, { status: 500 });
  }
}