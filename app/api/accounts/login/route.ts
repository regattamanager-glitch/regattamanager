import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { randomInt } from "crypto";
import nodemailer from "nodemailer";
// Umgestellt auf den direkten Prisma 7 Export
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";
export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    // 1. Daten aus dem Request holen
    const body = await req.json().catch(() => ({}));
    const { email, passwort } = body;

    if (!email || !passwort) {
      return NextResponse.json({ success: false, message: "Fehlende Daten" }, { status: 400 });
    }

    // 2. Nutzer suchen (Zuerst Segler, dann Verein)
    let user: any = await prisma.segler.findUnique({ where: { email } });
    let userType: "segler" | "verein" = "segler";

    if (!user) {
      user = await prisma.verein.findUnique({ where: { email } });
      userType = "verein";
    }

    // Falls Nutzer gar nicht existiert oder Passwort falsch ist (Sicherheits-Vermeidung von User-Enumeration)
    if (!user) {
      return NextResponse.json({ success: false, message: "Ungültige Anmeldedaten" }, { status: 401 });
    }

    // 3. Passwort prüfen
    const ok = await bcrypt.compare(passwort, user.passwort);
    if (!ok) {
      return NextResponse.json({ success: false, message: "Ungültige Anmeldedaten" }, { status: 401 });
    }

    // 4. Sicherheitscode generieren
    const code = randomInt(100000, 999999).toString();
    const expires = new Date(Date.now() + 5 * 60 * 1000); // 5 Minuten gültig

    // 5. Code in Neon DB speichern
    await prisma.loginCode.create({
      data: {
        email,
        code,
        expires,
        // Zuordnung je nach Nutzertyp
        seglerId: userType === "segler" ? user.id : null,
        vereinId: userType === "verein" ? user.id : null,
      },
    });

    // 6. E-Mail Versand vorbereiten
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT),
      secure: process.env.SMTP_SECURE === "true", 
      auth: { 
        user: process.env.SMTP_USER, 
        pass: process.env.SMTP_PASS 
      },
    });

    // 7. Mail senden
    await transporter.sendMail({
      from: `"Regatta Manager" <${process.env.SMTP_USER}>`,
      to: email,
      subject: "Dein Sicherheitscode für Regatta Manager",
      html: `
        <body style="...background-color:#001f3f;...">
          ...
          <span style="...">${code}</span>
          ...
        </body>
      `
    });

    return NextResponse.json({ success: true, requiresCode: true });

  } catch (err) {
    console.error("Detaillierter Login-Fehler (Prisma/SMTP):", err);
    return NextResponse.json({ success: false, message: "Serverfehler beim Login-Prozess" }, { status: 500 });
  }
}