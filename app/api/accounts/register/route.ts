import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import crypto from "crypto";
import bcrypt from "bcryptjs"; 
import nodemailer from "nodemailer";

const accountsFile = path.join(process.cwd(), "app/api/accounts/accounts.json");
const codesFile = path.join(process.cwd(), "app/api/accounts/loginCodes.json");
const accounts = loadJSON(accountsFile) || []; // ← falls null

// Hilfsfunktionen
function loadJSON(file: string) {
  if (!fs.existsSync(file)) fs.writeFileSync(file, "[]");
  const data = JSON.parse(fs.readFileSync(file, "utf-8"));
  if (!Array.isArray(data)) return [];
  // entferne Null/undef
  return data.filter((u: any) => u && typeof u === "object");
}

function saveJSON(file: string, data: any) {
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { type, email, passwort, vorname, nachname, geburtsjahr, nation, name, kuerzel, adresse } = body;

    if (!type || !email || !passwort) {
      return NextResponse.json({ success: false, message: "Fehlende Pflichtfelder" }, { status: 400 });
    }

    const accounts = loadJSON(accountsFile) || [];
    
    if (!email) {
      return NextResponse.json({ success: false, message: "E-Mail fehlt" }, { status: 400 });
    }
    
    if (accounts.some((u: any) => u.email === email)){
      return NextResponse.json({ success: false, message: "Email existiert bereits" }, { status: 400 });
    }
    
    // Passwort hashen & Verification-Code
    const hashedPassword = await bcrypt.hash(passwort, 10);
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expires = Date.now() + 5 * 60 * 1000;
    
    const pendingData: any = { id: crypto.randomUUID(), type, email, passwort: hashedPassword };
    
    if (type === "segler") {
      pendingData.vorname = vorname;
      pendingData.nachname = nachname;
      pendingData.geburtsjahr = geburtsjahr;
      pendingData.nation = nation;
      pendingData.vereine = [];
    } else if (type === "verein") {
      pendingData.name = name;
      pendingData.kuerzel = kuerzel;
      pendingData.adresse = adresse;
    }
    
    // Codes speichern
    const codes = loadJSON(codesFile);
    const filtered = codes.filter((c: any) => c.email !== email);
    filtered.push({ email, code: verificationCode, expires, data: pendingData });
    saveJSON(codesFile, filtered);
    
    // --- E-Mail senden (bestehendes Layout beibehalten) ---
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
                    <table width="100%" cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td valign="middle" style="text-align:left;">
                          <h1 style="margin:0;font-size:24px;">Regatta Manager</h1>
                          <p style="margin:3px 0 0 0;font-size:12px;color:#cbd5e1;">Built by Sailors for Sailors</p>
                        </td>
                        <td valign="middle" style="text-align:right;">
                          <img src="http://192.168.178.136:3000/public/logo.png" alt="Logo" width="5" height="5" style="display:block;">
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td bgcolor="#112d5c" style="padding:40px 30px;color:#e2e8f0;">
                    <h2 style="margin-top:0;font-size:20px;color:#ffffff;">Sicherheitscode für deinen Login</h2>
                    <p style="font-size:15px;line-height:1.6;color:#e2e8f0;">
                      Du hast versucht, dich bei <strong>Regatta Manager</strong> anzumelden.
                      Bitte verwende den folgenden Code, um den Login abzuschließen:
                    </p>
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
                    <p style="font-size:14px;color:#e2e8f0;">Der Code ist <strong>5 Minuten</strong> gültig.</p>
                    <hr style="border:none;border-top:1px solid rgba(255,255,255,0.15);margin:30px 0;" />
                    <p style="font-size:13px;color:#cbd5e1;line-height:1.6;">
                      Falls du diesen Login nicht angefordert hast, kannst du diese E-Mail ignorieren.
                      Dein Konto bleibt sicher.
                    </p>
                  </td>
                </tr>
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

    return NextResponse.json({ success: true, message: "Verifikationscode an deine E-Mail gesendet!" });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ success: false, message: "Fehler beim Erstellen des Accounts" }, { status: 500 });
  }
}
