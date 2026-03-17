import { NextResponse } from "next/server";
import { randomBytes } from "crypto";
import nodemailer from "nodemailer";
import { Pool } from "pg";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

export async function POST(req: Request) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json(
        { error: "E-Mail ist erforderlich" },
        { status: 400 }
      );
    }

    const client = await pool.connect();

    try {
      // 1. Prüfen, ob der User existiert
      const seglerRes = await client.query('SELECT id FROM "Segler" WHERE email = $1', [email]);
      const vereinRes = await client.query('SELECT id FROM "Verein" WHERE email = $1', [email]);

      const isSegler = seglerRes.rows.length > 0;
      const isVerein = vereinRes.rows.length > 0;

      if (!isSegler && !isVerein) {
        return NextResponse.json({
          message: "Falls ein Konto existiert, wurde ein Reset-Link gesendet.",
        });
      }

      // 2. Token generieren
      const token = randomBytes(32).toString("hex");
      const expires = new Date(Date.now() + 3600000); // 1 Stunde gültig

      // 3. In der Datenbank speichern (Tabellennamen in Anführungszeichen wegen Case-Sensitivity)
      const targetTable = isSegler ? '"Segler"' : '"Verein"';
      
      await client.query(
        `UPDATE ${targetTable} SET reset_token = $1, reset_token_expires = $2 WHERE email = $3`,
        [token, expires, email]
      );

      // 4. E-Mail Versand vorbereiten
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT),
        secure: false, 
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });

      const resetUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/reset-password?token=${token}`;

      const mailOptions = {
        from: '"Regatta Manager" <regattamanagerverify@gmail.com>',
        to: email,
        subject: "Reset your password - Regatta Manager",
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: auto; border: 1px solid #e5e7eb; padding: 20px; border-radius: 12px;">
            <h2 style="color: #1e3a8a; text-align: center;">Reset your password</h2>
            <p>Hello,</p>
            <p>You recently requested to reset your password for <strong>Regatta Manager</strong>.</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetUrl}" 
                 style="background-color: #1d4ed8; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
                 Set new password
              </a>
            </div>
            <p style="font-size: 13px; color: #6b7280;">
              This link is valid for 60 minutes. If you did not request a password reset, please ignore this email.
            </p>
            <hr style="border: 0; border-top: 1px solid #e5e7eb; margin: 20px 0;" />
            <p style="font-size: 11px; color: #9ca3af; text-align: center;">
              Regatta Manager &copy; 2026
            </p>
          </div>
        `,
      };

      await transporter.sendMail(mailOptions);

    } finally {
      client.release();
    }

    return NextResponse.json(
      { message: "E-Mail erfolgreich versendet" },
      { status: 200 }
    );

  } catch (error) {
    console.error("Forgot Password Error:", error);
    return NextResponse.json(
      { error: "Interner Serverfehler" },
      { status: 500 }
    );
  }
}