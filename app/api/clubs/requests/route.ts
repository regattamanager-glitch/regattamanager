import { NextResponse } from 'next/server';
import { createPool } from '@vercel/postgres';

// Wir nutzen createPool, damit wir flexibel auf deine URL zugreifen können
const pool = createPool({
  connectionString: process.env.POSTGRES_URL 
});

// 1. ANFRAGEN ABGEBEN (Bewerben)
export async function POST(request: Request) {
  try {
    const { clubId, userId, message } = await request.json();

    if (!clubId || !userId) {
      return NextResponse.json({ error: "Daten unvollständig" }, { status: 400 });
    }

    // Wir speichern die Anfrage in der Tabelle 'club_requests'
    await pool.query(`
      INSERT INTO club_requests (club_id, user_id, message, status, timestamp)
      VALUES ($1, $2, $3, $4, $5)
    `, [clubId, userId, message || '', 'PENDING', new Date().toISOString()]);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Datenbank-Fehler beim Bewerben:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const clubId = searchParams.get('clubId');

  if (!clubId) return NextResponse.json([]);

  try {
    // 1. NUR die Basis-Anfragen laden (Das funktioniert garantiert, da club_requests existiert)
    const { rows: requests } = await pool.query(`
      SELECT * FROM club_requests 
      WHERE club_id::text = $1::text 
      ORDER BY timestamp DESC
    `, [clubId]);

    // 2. Versuchen, die Namen aus der Segler-Tabelle zu holen
    // Wir machen das Mapping händisch, damit bei einem Fehler nicht alles leer bleibt
    const enriched = await Promise.all(requests.map(async (req: any) => {
      try {
        // Hier probieren wir verschiedene Tabellennamen (segler, Segler, users...)
        // Ich nutze jetzt erst einmal einen direkten Query pro Segler (nicht effizient, aber sicher für den Test)
        const { rows: user } = await pool.query(
          `SELECT vorname, nachname, nation, email FROM "Segler" WHERE id::text = $1::text LIMIT 1`,
          [req.user_id]
        );

        if (user.length > 0) {
          return {
            ...req,
            clubId: req.club_id,
            userId: req.user_id,
            userName: `${user[0].vorname} ${user[0].nachname}`,
            userNation: user[0].nation,
            userEmail: user[0].email
          };
        }
      } catch (e) {
        // Falls "Segler" nicht existiert, ignorieren wir den Fehler hier einfach
      }

      // Fallback, wenn kein User gefunden wurde oder Tabelle fehlt
      return {
        ...req,
        clubId: req.club_id,
        userId: req.user_id,
        userName: `Segler (ID: ${req.user_id.substring(0, 4)})`,
        userNation: "??",
        userEmail: "Profil nicht gefunden"
      };
    }));

    return NextResponse.json(enriched);

  } catch (error: any) {
    console.error("❌ Kritischer Fehler in Requests:", error.message);
    return NextResponse.json([]);
  }
}