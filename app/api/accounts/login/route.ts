import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { randomInt } from "crypto";
import nodemailer from "nodemailer";
import { prisma } from "@/lib/prisma"; // Stelle sicher, dass du prisma client exportierst

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const { email, passwort } = await req.json();

    if (!email || !passwort) {
      return NextResponse.json({ success: false, message: "Fehlende Daten" }, { status: 400 });
    }

    // Nutzer aus Prisma laden (Segler + Verein)
    const user = await prisma.segler.findUnique({ where: { email } }) 
                 || await prisma.verein.findUnique({ where: { email } });

    if (!user) {
      return NextResponse.json({ success: false, message: "Ungültige Daten" }, { status: 401 });
    }

    // Passwort prüfen
    const ok = await bcrypt.compare(passwort, user.passwort);
    if (!ok) {
      return NextResponse.json({ success: false, message: "Ungültige Daten" }, { status: 401 });
    }

    // Sicherheitscode generieren
    const code = randomInt(100000, 999999).toString();
    const expires = new Date(Date.now() + 5 * 60 * 1000);

    // Code in DB speichern
    await prisma.loginCode.create({
      data: {
        email,
        code,
        expires,
        seglerId: user.hasOwnProperty("vorname") ? user.id : null,
        vereinId: user.hasOwnProperty("name") ? user.id : null,
      },
    });

    // E-Mail vorbereiten
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT),
      secure: false,
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    });

    // Mail senden
    await transporter.sendMail({
      from: `"Regatta Manager" <${process.env.SMTP_USER}>`,
      to: email,
      subject: "Dein Sicherheitscode für Regatta Manager",
      html: `
      <!DOCTYPE html>
      <html lang="de">
      <head><meta charset="UTF-8"><title>Regatta Manager Sicherheitscode</title></head>
      <body style="margin:0;padding:0;background-color:#001f3f;" bgcolor="#001f3f">
      <table width="100%" bgcolor="#001f3f" cellpadding="0" cellspacing="0">
      <tr><td align="center">
        <table width="600" bgcolor="#001f3f" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
          <tr><td bgcolor="#0b3d91" style="padding:20px;color:#fff;">
            <h1 style="margin:0;font-size:24px;">Regatta Manager</h1>
            <p style="margin:3px 0 0 0;font-size:12px;color:#cbd5e1;">Built by Sailors for Sailors</p>
          </td></tr>
          <tr><td bgcolor="#112d5c" style="padding:40px 30px;color:#e2e8f0;">
            <h2 style="margin-top:0;font-size:20px;color:#fff;">Sicherheitscode für deinen Login</h2>
            <p>Du hast versucht, dich bei <strong>Regatta Manager</strong> anzumelden. Bitte verwende den folgenden Code:</p>
            <div style="margin:35px 0;text-align:center;">
              <span style="display:inline-block;padding:20px 35px;font-size:32px;letter-spacing:8px;font-weight:bold;background:#2563eb;color:#fff;border-radius:14px;box-shadow:0 6px 18px rgba(0,0,0,0.4);">
                ${code}
              </span>
            </div>
            <p>Der Code ist <strong>5 Minuten</strong> gültig.</p>
          </td></tr>
          <tr><td bgcolor="#0b3d91" style="padding:20px;text-align:center;color:#cbd5e1;font-size:12px;">
            © ${new Date().getFullYear()} Regatta Manager – automatisch generierte Nachricht
          </td></tr>
        </table>
      </td></tr>
      </table>
      </body></html>
      `,
    });

    return NextResponse.json({ success: true, requiresCode: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ success: false, message: "Serverfehler" }, { status: 500 });
  }
}