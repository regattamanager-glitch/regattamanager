import fs from "fs"; 
import path from "path";
import bcrypt from "bcryptjs";
import { randomInt } from "crypto";
import { NextResponse } from "next/server";
import nodemailer from "nodemailer";

export const runtime = "nodejs";

const accountsFile = path.join(process.cwd(), "app/api/accounts/accounts.json");
const codesFile = path.join(process.cwd(), "app/api/accounts/loginCodes.json");

export async function POST(req: Request) {
  const { email, passwort } = await req.json();

  const accounts = JSON.parse(fs.readFileSync(accountsFile, "utf-8"));
  const user = accounts.find((u: any) => u.email === email);

  if (!user) {
    return NextResponse.json({ success: false, message: "Ungültige Daten" });
  }

  const ok = await bcrypt.compare(passwort, user.passwort);
  if (!ok) {
    return NextResponse.json({ success: false, message: "Ungültige Daten" });
  }

  const code = randomInt(100000, 999999).toString();

  const codes = fs.existsSync(codesFile)
    ? JSON.parse(fs.readFileSync(codesFile, "utf-8"))
    : [];

  codes.push({
    email,
    code,
    expires: Date.now() + 5 * 60 * 1000
  });

  fs.writeFileSync(codesFile, JSON.stringify(codes, null, 2));

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  try {
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
    <!-- Äußere Tabelle -->
    <table width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#001f3f">
      <tr>
        <td align="center">

          <!-- Hauptcontainer -->
          <table width="600" cellpadding="0" cellspacing="0" border="0" bgcolor="#001f3f" style="border-collapse:collapse;">

            <!-- Header -->
            <tr>
              <td bgcolor="#0b3d91" style="padding:20px;color:#ffffff;">
                <table width="100%" cellpadding="0" cellspacing="0" border="0">
                  <tr>
                    <!-- Linke Seite -->
                    <td valign="middle" style="text-align:left;">
                      <h1 style="margin:0;font-size:24px;">Regatta Manager</h1>
                      <p style="margin:3px 0 0 0;font-size:12px;color:#cbd5e1;">Built by Sailors for Sailors</p>
                    </td>
                    <!-- Rechte Seite (Logo) -->
                    <td valign="middle" style="text-align:right;">
                      <img src="http://192.168.178.136:3000/public/logo.png" alt="Logo" width="5" height="5" style="display:block;">
                    </td>
                  </tr>
                </table>
              </td>
            </tr>

            <!-- Hauptblock -->
            <tr>
              <td bgcolor="#112d5c" style="padding:40px 30px;color:#e2e8f0;">
                <h2 style="margin-top:0;font-size:20px;color:#ffffff;">Sicherheitscode für deinen Login</h2>
                <p style="font-size:15px;line-height:1.6;color:#e2e8f0;">
                  Du hast versucht, dich bei <strong>Regatta Manager</strong> anzumelden.
                  Bitte verwende den folgenden Code, um den Login abzuschließen:
                </p>

                <!-- Code Box -->
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
                    ${code}
                  </span>
                </div>

                <p style="font-size:14px;color:#e2e8f0;">Der Code ist <strong>5 Minuten</strong> gültig.</p>

                <hr style="border:none;border-top:1px solid rgba(255,255,255,0.15);margin:30px 0;" />

                <p style="font-size:13px;color:#cbd5e1;line-height:1.6;">
                  Falls du diesen Login nicht angefordert hast, kannst du diese E-Mail ignorieren.
                  Dein Konto bleibt sicher.
                </p>
              </td>
            </tr>

            <!-- Footer -->
            <tr>
              <td bgcolor="#0b3d91" style="padding:20px;text-align:center;color:#cbd5e1;font-size:12px;">
                © ${new Date().getFullYear()} Regatta Manager<br/>
                Automatisch generierte Nachricht – bitte nicht antworten.
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


  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false });
  }

  return NextResponse.json({
    success: true,
    requiresCode: true
  });
}
