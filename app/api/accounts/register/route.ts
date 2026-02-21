// app/api/accounts/register/route.ts
import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import nodemailer from "nodemailer";
import { prisma } from "@/lib/prisma"; // Dein Prisma-Client import

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { type, email, passwort, vorname, nachname, geburtsjahr, nation, name, kuerzel, adresse } = body;

    // Pflichtfelder prüfen
    if (!type || !email || !passwort) {
      return NextResponse.json({ success: false, message: "Fehlende Pflichtfelder" }, { status: 400 });
    }

    // Prüfe, ob E-Mail schon existiert
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return NextResponse.json({ success: false, message: "Email existiert bereits" }, { status: 400 });
    }

    // Passwort hashen
    const hashedPassword = await bcrypt.hash(passwort, 10);

    // Generiere Verifikationscode
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expires = new Date(Date.now() + 5 * 60 * 1000); // 5 Minuten

    // User in DB vorbereiten (noch nicht aktiv, bis Verifikation)
    const pendingUser = {
      id: crypto.randomUUID(),
      type,
      email,
      passwort: hashedPassword,
      ...(type === "segler"
        ? { vorname, nachname, geburtsjahr: Number(geburtsjahr), nation }
        : { name, kuerzel, adresse }),
      active: false,
    };

    // Verifikationscode speichern
    await prisma.verificationCode.create({
      data: {
        email,
        code: verificationCode,
        expires,
        userData: pendingUser as any, // JSON in DB speichern
      },
    });

    // --- E-Mail versenden ---
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || "587"),
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    });

    await transporter.sendMail({
      from: `"Regatta Manager" <${process.env.SMTP_USER}>`,
      to: email,
      subject: "Dein Sicherheitscode für Regatta Manager",
      html: `
        <!DOCTYPE html>
        <html lang="de">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Regatta Manager Sicherheitscode</title>
        </head>
        <body style="margin:0;padding:0;background-color:#001f3f;" bgcolor="#001f3f">
          <table width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#001f3f">
            <tr>
              <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" border="0" bgcolor="#001f3f" style="border-collapse:collapse;">
                  <tr>
                    <td bgcolor="#0b3d91" style="padding:20px;color:#ffffff;">
                      <h1>Regatta Manager</h1>
                      <p>Built by Sailors for Sailors</p>
                    </td>
                  </tr>
                  <tr>
                    <td bgcolor="#112d5c" style="padding:40px 30px;color:#e2e8f0;">
                      <h2>Sicherheitscode für deinen Login</h2>
                      <p>Bitte verwende den folgenden Code, um den Login abzuschließen:</p>
                      <div style="margin:35px 0;text-align:center;">
                        <span style="
                          display:inline-block;
                          padding:20px 35px;
                          font-size:32px;
                          letter-spacing:8px;
                          font-weight:bold;
                          background:#2563eb;
                          color:#ffffff;
                          border-radius:14px;
                          box-shadow:0 6px 18px rgba(0,0,0,0.4);
                        ">
                          ${verificationCode}
                        </span>
                      </div>
                      <p>Der Code ist <strong>5 Minuten</strong> gültig.</p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
        </html>
      `,
    });

    return NextResponse.json({ success: true, message: "Verifikationscode an deine E-Mail gesendet!" });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ success: false, message: "Fehler beim Erstellen des Accounts" }, { status: 500 });
  }
}