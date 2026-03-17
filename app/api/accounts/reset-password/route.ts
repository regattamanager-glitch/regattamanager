import { NextResponse } from "next/server";
import { Pool } from "pg";
import bcrypt from "bcryptjs"; // Falls du Passwörter hashen willst (empfohlen)

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

export async function POST(req: Request) {
  try {
    const { token, password } = await req.json();

    if (!token || !password) {
      return NextResponse.json(
        { error: "Token und Passwort sind erforderlich" },
        { status: 400 }
      );
    }

    const client = await pool.connect();

    try {
      const now = new Date();

      const seglerCheck = await client.query(
        'SELECT id FROM "Segler" WHERE reset_token = $1 AND reset_token_expires > $2',
        [token, now]
      );
      const vereinCheck = await client.query(
        'SELECT id FROM "Verein" WHERE reset_token = $1 AND reset_token_expires > $2',
        [token, now]
      );

      const isSegler = seglerCheck.rows.length > 0;
      const isVerein = vereinCheck.rows.length > 0;

      if (!isSegler && !isVerein) {
        return NextResponse.json(
          { error: "Der Link ist ungültig oder abgelaufen." },
          { status: 400 }
        );
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      // 3. Passwort aktualisieren und Token löschen
      const targetTable = isSegler ? '"Segler"' : '"Verein"';
      
      await client.query(
        `UPDATE ${targetTable} 
         SET passwort = $1, reset_token = NULL, reset_token_expires = NULL 
         WHERE reset_token = $2`,
        [hashedPassword, token]
      );

      return NextResponse.json(
        { message: "Passwort erfolgreich zurückgesetzt" },
        { status: 200 }
      );

    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Reset Password Error:", error);
    return NextResponse.json(
      { error: "Interner Serverfehler" },
      { status: 500 }
    );
  }
}