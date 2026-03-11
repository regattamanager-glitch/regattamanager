import { NextRequest, NextResponse } from "next/server";
import sql from "@/lib/db";

/* ================================================= */
/* ======================= GET ===================== */
/* ================================================= */

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const eventId = url.searchParams.get("eventId");
    const klasse = url.searchParams.get("klasse");

    // FALLS keine Parameter gesendet werden (Dashboard-Ansicht)
    // Wir bauen das verschachtelte Objekt aus der flachen DB-Struktur nach
    if (!eventId || !klasse) {
      const allRows = await sql`SELECT event_id, klasse, segler_id, scores FROM results`;
      
      const formatted = allRows.reduce((acc: any, row) => {
        if (!acc[row.event_id]) acc[row.event_id] = {};
        if (!acc[row.event_id][row.klasse]) acc[row.event_id][row.klasse] = {};
        
        // Scores sind in der DB als JSONB gespeichert und werden automatisch geparst
        acc[row.event_id][row.klasse][row.segler_id] = row.scores;
        return acc;
      }, {});

      return NextResponse.json(formatted);
    }

    // FALLS Parameter gesendet werden (Event-Detail-Ansicht)
    const rows = await sql`
      SELECT segler_id, scores 
      FROM results 
      WHERE event_id = ${eventId} AND klasse = ${klasse}
    `;

    // Umwandeln in das Format { "segler-id": [scores], ... }
    const classResults = rows.reduce((acc: any, row) => {
      acc[row.segler_id] = row.scores;
      return acc;
    }, {});

    return NextResponse.json({
      success: true,
      results: classResults
    });

  } catch (err) {
    console.error("GET RESULTS ERROR:", err);
    return NextResponse.json({ success: false, error: (err as Error).message });
  }
}

/* ================================================= */
/* ======================= POST ==================== */
/* ================================================= */

export async function POST(req: NextRequest) {
  try {
    const { eventId, klasse, results } = await req.json();

    if (!eventId || !klasse || !Array.isArray(results)) {
      return NextResponse.json({
        success: false,
        error: "eventId, klasse oder results fehlen"
      });
    }

    // Da Neon HTTP keine .begin() Methode auf dem Standard-Query-Objekt hat,
    // führen wir die Inserts einfach direkt aus. 
    // Promise.all sorgt dafür, dass alle gleichzeitig verarbeitet werden.
    await Promise.all(
      results.map(async (entry: any) => {
        if (!entry.seglerId) return;

        return sql`
          INSERT INTO results (event_id, klasse, segler_id, scores, updated_at)
          VALUES (
            ${eventId}, 
            ${klasse}, 
            ${entry.seglerId}, 
            ${JSON.stringify(entry.scores)}, 
            NOW()
          )
          ON CONFLICT (event_id, klasse, segler_id) 
          DO UPDATE SET 
            scores = EXCLUDED.scores,
            updated_at = NOW()
        `;
      })
    );

    return NextResponse.json({ success: true });

  } catch (err) {
    console.error("POST RESULTS ERROR:", err);
    return NextResponse.json({
      success: false,
      error: (err as Error).message
    });
  }
}