import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
// Umgestellt auf den direkten Prisma 7 Export
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { email, currentPassword, update } = body;

    if (!email || !currentPassword || !update) {
      return NextResponse.json({ success: false, message: "Fehlende Daten" }, { status: 400 });
    }

    // 1. Benutzer suchen
    let user: any = await prisma.segler.findUnique({ where: { email } });
    let userType: "segler" | "verein" = "segler";

    if (!user) {
      user = await prisma.verein.findUnique({ where: { email } });
      userType = "verein";
    }

    if (!user) {
      return NextResponse.json({ success: false, message: "Benutzer nicht gefunden" }, { status: 404 });
    }

    // 2. Passwort zur Sicherheit vor Änderungen prüfen
    const match = await bcrypt.compare(currentPassword, user.passwort);
    if (!match) {
      return NextResponse.json({ success: false, message: "Aktuelles Passwort falsch" }, { status: 401 });
    }

    // 3. Update-Daten vorbereiten
    const updateData: any = {};

    // Falls ein neues Passwort gesetzt werden soll
    if (update.passwort && update.passwort.trim() !== "") {
      updateData.passwort = await bcrypt.hash(update.passwort, 10);
    }

    // Email-Änderung (Achtung: Prisma wirft Fehler, falls neue Email schon existiert)
    if (update.email && update.email !== email) {
      updateData.email = update.email;
    }

    // 4. Typ-spezifische Felder mappen
    if (userType === "segler") {
      const seglerFields = ["vorname", "nachname", "nation", "worldSailingId", "instagram", "tiktok", "profilbild"];
      seglerFields.forEach(f => {
        if (update[f] !== undefined) updateData[f] = update[f];
      });

      const updatedSegler = await prisma.segler.update({
        where: { email },
        data: updateData,
        // Passwort nicht zurück ans Frontend senden
        select: { id: true, email: true, vorname: true, nachname: true, nation: true, worldSailingId: true }
      });

      return NextResponse.json({ success: true, user: updatedSegler });
    } else {
      const vereinFields = ["name", "kuerzel", "adresse", "stripeAccountId", "instagram", "tiktok"];
      vereinFields.forEach(f => {
        if (update[f] !== undefined) updateData[f] = update[f];
      });

      const updatedVerein = await prisma.verein.update({
        where: { email },
        data: updateData,
        select: { id: true, email: true, name: true, kuerzel: true, stripeAccountId: true }
      });

      return NextResponse.json({ success: true, user: updatedVerein });
    }

  } catch (error: any) {
    console.error("Detaillierter Update-Fehler:", error);
    // P2002 ist der Prisma-Code für Unique-Constraint-Verletzung (z.B. Email schon vergeben)
    if (error.code === 'P2002') {
      return NextResponse.json({ success: false, message: "Die neue E-Mail wird bereits verwendet." }, { status: 400 });
    }
    return NextResponse.json({ success: false, message: "Fehler beim Aktualisieren der Daten" }, { status: 500 });
  }
}