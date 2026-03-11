import { NextResponse } from "next/server";
import sql from '@/lib/db';

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

export async function GET() {
  try {
    // Aktuelles Datum für den Vergleich
    const now = new Date();

    // SQL-Abfrage: Nur nicht abgelaufene Codes, sortiert nach Erstellungsdatum
    // Wir nutzen "LoginCode" (in Anführungszeichen), da PostgreSQL Case-Sensitive ist
    const invitations = await sql`
      SELECT * FROM "LoginCode" 
      WHERE expires > ${now} 
      ORDER BY "createdAt" DESC
    `;

    return NextResponse.json(invitations);
  } catch (error) {
    console.error("Einladungs-Fehler in /api/accounts/invitations:", error);
    return NextResponse.json(
      { error: "Fehler beim Laden der Einladungen aus der Datenbank" },
      { status: 500 }
    );
  }
}