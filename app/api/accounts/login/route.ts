import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { randomInt } from "crypto";
import nodemailer from "nodemailer";
// Import auf 'db' korrigiert (passend zu deiner lib/prisma.ts)
import db from "@/lib/prisma"; 

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const { email, passwort } = await req.json();

    if (!email || !passwort) {
      return NextResponse.json({ success: false, message: "Fehlende Daten" }, { status: 400 });
    }

    // 1. Nutzer aus Prisma laden (Zuerst Segler, dann Verein)
    let user: any = await db.segler.findUnique({ where: { email } });
    let userType: "segler" | "verein" = "segler";

    if (!user) {
      user = await db.verein.findUnique({ where: { email } });
      userType = "verein";
    }

    if (!user) {
      return NextResponse.json({ success: false, message: "Ungültige Daten" }, { status: 401 });
    }

    // 2. Passwort prüfen
    const ok = await bcrypt.compare(passwort, user.passwort);
    if (!ok) {
      return NextResponse.json({ success: false, message: "Ungültige Daten" }, { status: 401 });
    }

    // 3. Sicherheitscode generieren
    const code = randomInt(100000, 999999).toString();
    const expires = new Date(Date.now() + 5 * 60 * 1000);

    // 4. Code in DB speichern
    await db.loginCode.create({
      data: {
        email,
        code,
        expires,
        seglerId: userType === "segler" ? user.id : null,
        vereinId: userType === "verein" ? user.id : null,
      },
    });

    // 5. E-Mail vorbereiten
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT),
      secure: false, // true für 465, false für andere Ports
      auth: { 
        user: process.env.SMTP_USER, 
        pass: process.env.SMTP_PASS 
      },
    });

    // 6. Mail senden mit dem vollständigen Template
    await transporter.sendMail({
      from: `"Regatta Manager" <${process.env.SMTP_USER}>`,
      to: email,
      subject: "Dein Sicherheitscode für Regatta Manager",
      html: `
      <!DOCTYPE html>
      <html lang="de">
      <head>
        <meta charset="UTF-8">
        <title>Regatta Manager Sicherheitscode</title>
      </head>
      <body style="margin:0;padding:0;background-color:#001f3f;font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;" bgcolor="#001f3f">
        <table width="100%" bgcolor="#001f3f" cellpadding="0" cellspacing="0">
          <tr>
            <td align="center">
              <table width="600" bgcolor="#001f3f" cellpadding="0" cellspacing="0" style="border-collapse:collapse; margin: 40px 0;">
                <tr>
                  <td bgcolor="#0b3d91" style="padding:20px;color:#fff; border-radius: 10px 10px 0 0;">
                    <h1 style="margin:0;font-size:24px;">Regatta Manager</h1>
                    <p style="margin:3px 0 0 0;font-size:12px;color:#cbd5e1;">Built by Sailors for Sailors</p>
                  </td>
                </tr>
                <tr>
                  <td bgcolor="#112d5c" style="padding:40px 30px;color:#e2e8f0;">
                    <h2 style="margin-top:0;font-size:20px;color:#fff;">Sicherheitscode für deinen Login</h2>
                    <p>Du hast versucht, dich bei <strong>Regatta Manager</strong> anzumelden. Bitte verwende den folgenden Code, um deine Identität zu bestätigen:</p>
                    
                    <div style="margin:35px 0;text-align:center;">
                      <span style="display:inline-block;padding:20px 35px;font-size:32px;letter-spacing:8px;font-weight:bold;background:#2563eb;color:#fff;border-radius:14px;box-shadow:0 6px 18px rgba(0,0,0,0.4);">
                        ${code}
                      </span>
                    </div>
                    
                    <p>Dieser Code ist aus Sicherheitsgründen nur <strong>5 Minuten</strong> gültig.</p>
                    <p style="font-size: 14px; color: #94a3b8;">Falls du diesen Code nicht angefordert hast, kannst du diese E-Mail einfach ignorieren.</p>
                  </td>
                </tr>
                <tr>
                  <td bgcolor="#0b3d91" style="padding:20px;text-align:center;color:#cbd5e1;font-size:12px; border-radius: 0 0 10px 10px;">
                    © ${new Date().getFullYear()} Regatta Manager – Die Plattform für Segelvereine und Regatten.<br>
                    Diese Nachricht wurde automatisch generiert.
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

    return NextResponse.json({ success: true, requiresCode: true });
  } catch (err) {
    console.error("Detaillierter Login-Fehler:", err);
    return NextResponse.json({ success: false, message: "Serverfehler beim Login" }, { status: 500 });
  }
}