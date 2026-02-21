// app/api/accounts/register/route.ts
import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import db from "@/lib/prisma"; // Nutzt dein exportiertes 'db'
import nodemailer from "nodemailer";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { type, email, passwort, vorname, nachname, geburtsjahr, nation, name, kuerzel, adresse } = body;

    // 1. Pflichtfelder prüfen
    if (!type || !email || !passwort) {
      return NextResponse.json({ success: false, message: "Fehlende Pflichtfelder" }, { status: 400 });
    }

    // 2. Prüfe in beiden Tabellen, ob Email existiert (da du kein gemeinsames User-Model hast)
    const existingSegler = await db.segler.findUnique({ where: { email } });
    const existingVerein = await db.verein.findUnique({ where: { email } });

    if (existingSegler || existingVerein) {
      return NextResponse.json({ success: false, message: "Email existiert bereits" }, { status: 400 });
    }

    // 3. Passwort hashen
    const hashedPassword = await bcrypt.hash(passwort, 10);

    // 4. Generiere Verifikationscode
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expires = new Date(Date.now() + 5 * 60 * 1000); // 5 Minuten gültig

    // 5. User direkt anlegen (entsprechend deinem Schema)
    if (type === "segler") {
      await db.segler.create({
        data: {
          email,
          passwort: hashedPassword,
          vorname: vorname || "",
          nachname: nachname || "",
          geburtsjahr: String(geburtsjahr), // Dein Schema nutzt String
          nation: nation || "GER",
        }
      });
    } else {
      await db.verein.create({
        data: {
          email,
          passwort: hashedPassword,
          name: name || "",
          kuerzel: kuerzel || "",
          adresse: adresse || "",
        }
      });
    }

    // 6. Verifikationscode im LoginCode-Model speichern
    await db.loginCode.create({
      data: {
        email,
        code: verificationCode,
        expires,
      },
    });

    // 7. E-Mail vorbereiten
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || "587"),
      secure: false,
      auth: { 
        user: process.env.SMTP_USER, 
        pass: process.env.SMTP_PASS 
      },
    });

    // 8. E-Mail versenden mit dem vollständigen Regatta Manager Template
    await transporter.sendMail({
      from: `"Regatta Manager" <${process.env.SMTP_USER}>`,
      to: email,
      subject: "Willkommen beim Regatta Manager - Bestätige deine Registrierung",
      html: `
      <!DOCTYPE html>
      <html lang="de">
      <head>
        <meta charset="UTF-8">
        <title>Regatta Manager Registrierung</title>
      </head>
      <body style="margin:0;padding:0;background-color:#001f3f;font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;" bgcolor="#001f3f">
        <table width="100%" bgcolor="#001f3f" cellpadding="0" cellspacing="0">
          <tr>
            <td align="center">
              <table width="600" bgcolor="#001f3f" cellpadding="0" cellspacing="0" style="border-collapse:collapse; margin: 40px 0;">
                <tr>
                  <td bgcolor="#0b3d91" style="padding:20px;color:#fff; border-radius: 10px 10px 0 0;">
                    <h1 style="margin:0;font-size:24px;">Regatta Manager</h1>
                    <p style="margin:3px 0 0 0;font-size:12px;color:#cbd5e1;">Willkommen an Bord!</p>
                  </td>
                </tr>
                <tr>
                  <td bgcolor="#112d5c" style="padding:40px 30px;color:#e2e8f0;">
                    <h2 style="margin-top:0;font-size:20px;color:#fff;">Bestätige deine Registrierung</h2>
                    <p>Vielen Dank für deine Anmeldung bei <strong>Regatta Manager</strong>. Um dein Konto zu aktivieren, gib bitte den folgenden Code ein:</p>
                    
                    <div style="margin:35px 0;text-align:center;">
                      <span style="display:inline-block;padding:20px 35px;font-size:32px;letter-spacing:8px;font-weight:bold;background:#2563eb;color:#fff;border-radius:14px;box-shadow:0 6px 18px rgba(0,0,0,0.4);">
                        ${verificationCode}
                      </span>
                    </div>
                    
                    <p>Dieser Code ist <strong>5 Minuten</strong> gültig.</p>
                    <p style="font-size: 14px; color: #94a3b8;">Hinweis: Als Segler können Stornierungen nach der Anmeldung nur über den jeweiligen Verein vorgenommen werden (zzgl. 8% Gebühr).</p>
                  </td>
                </tr>
                <tr>
                  <td bgcolor="#0b3d91" style="padding:20px;text-align:center;color:#cbd5e1;font-size:12px; border-radius: 0 0 10px 10px;">
                    © ${new Date().getFullYear()} Regatta Manager – Built by Sailors for Sailors.<br>
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

    return NextResponse.json({ success: true, message: "Verifikationscode gesendet!" });
  } catch (err) {
    console.error("Registrierungsfehler:", err);
    return NextResponse.json({ success: false, message: "Fehler beim Erstellen des Accounts" }, { status: 500 });
  }
}