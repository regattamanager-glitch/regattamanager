import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import nodemailer from "nodemailer";
// Umgestellt auf den direkten Prisma 7 Export
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    // 1. Daten aus dem Request holen
    const body = await req.json().catch(() => ({}));
    const { type, email, passwort, vorname, nachname, geburtsjahr, nation, name, kuerzel, adresse } = body;

    // 2. Pflichtfelder prüfen
    if (!type || !email || !passwort) {
      return NextResponse.json({ success: false, message: "Fehlende Pflichtfelder" }, { status: 400 });
    }

    // 3. Prüfen, ob die Email bereits existiert (in beiden Tabellen)
    const [existingSegler, existingVerein] = await Promise.all([
      prisma.segler.findUnique({ where: { email } }),
      prisma.verein.findUnique({ where: { email } })
    ]);

    if (existingSegler || existingVerein) {
      return NextResponse.json({ success: false, message: "Diese E-Mail-Adresse wird bereits verwendet." }, { status: 400 });
    }

    // 4. Passwort hashen
    const hashedPassword = await bcrypt.hash(passwort, 10);

    // 5. Verifikationscode generieren
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expires = new Date(Date.now() + 5 * 60 * 1000); // 5 Minuten gültig

    // 6. User in Neon DB anlegen (Transaktion wäre hier ideal, um Konsistenz zu wahren)
    const result = await prisma.$transaction(async (tx) => {
      let newUser;
      if (type === "segler") {
        newUser = await tx.segler.create({
          data: {
            email,
            passwort: hashedPassword,
            vorname: vorname || "",
            nachname: nachname || "",
            geburtsjahr: String(geburtsjahr),
            nation: nation || "GER",
          }
        });
      } else {
        newUser = await tx.verein.create({
          data: {
            email,
            passwort: hashedPassword,
            name: name || "",
            kuerzel: kuerzel || "",
            adresse: adresse || "",
          }
        });
      }

      // LoginCode speichern
      await tx.loginCode.create({
        data: {
          email,
          code: verificationCode,
          expires,
          // Wir verknüpfen den Code direkt mit der ID des neuen Users
          seglerId: type === "segler" ? newUser.id : null,
          vereinId: type === "verein" ? newUser.id : null,
        },
      });

      return newUser;
    });

    // 7. E-Mail Versand (Nodemailer)
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || "587"),
      secure: process.env.SMTP_SECURE === "true",
      auth: { 
        user: process.env.SMTP_USER, 
        pass: process.env.SMTP_PASS 
      },
    });

    await transporter.sendMail({
      from: `"Regatta Manager" <${process.env.SMTP_USER}>`,
      to: email,
      subject: "Willkommen beim Regatta Manager - Bestätige deine Registrierung",
      html: `
        ...
        <p>Code: <strong>${verificationCode}</strong></p>
        <p style="font-size: 12px;">Hinweis: Als Segler können Stornierungen nur über den Verein vorgenommen werden. Die 8% Systemgebühr sind nicht erstattungsfähig.</p>
        ...
      `
    });

    return NextResponse.json({ success: true, message: "Registrierung erfolgreich, Code gesendet!" });

  } catch (err) {
    console.error("Detaillierter Registrierungsfehler:", err);
    return NextResponse.json({ success: false, message: "Fehler beim Erstellen des Accounts" }, { status: 500 });
  }
}