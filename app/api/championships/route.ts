import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import sql from "@/lib/db";
import { requireAuth, forbidden } from "@/lib/auth";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

/**
 * GET /api/championships
 *   ?federationId=...  -> Meisterschaften einer Föderation
 *   (ohne Parameter)   -> alle Meisterschaften (öffentlich)
 */
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const federationId = searchParams.get("federationId");

    const rows = federationId
      ? await sql`
          SELECT c.*, f.name AS federation_name,
                 (SELECT COUNT(*) FROM championship_events ce WHERE ce.championship_id = c.id) AS event_count
          FROM championships c
          LEFT JOIN "Federation" f ON f.id = c.federation_id
          WHERE c.federation_id = ${federationId}
          ORDER BY c.created_at DESC
        `
      : await sql`
          SELECT c.*, f.name AS federation_name,
                 (SELECT COUNT(*) FROM championship_events ce WHERE ce.championship_id = c.id) AS event_count
          FROM championships c
          LEFT JOIN "Federation" f ON f.id = c.federation_id
          ORDER BY c.created_at DESC
        `;

    return NextResponse.json(rows);
  } catch (error) {
    console.error("GET championships error:", error);
    return NextResponse.json({ error: "Serverfehler" }, { status: 500 });
  }
}

/**
 * POST /api/championships  -> neue Meisterschaft (nur Föderationen, für sich selbst)
 */
export async function POST(req: Request) {
  try {
    const auth = await requireAuth();
    if (auth instanceof NextResponse) return auth;
    if (auth.userType !== "federation") {
      return forbidden("Nur Föderationen können Meisterschaften anlegen");
    }

    const body = await req.json().catch(() => ({}));
    const name = String(body.name || "").trim();
    const level = String(body.level || "").trim();
    const mode = ["sum", "discard", "best"].includes(body.scoring_mode)
      ? body.scoring_mode
      : "sum";
    const discardCount = Number.isFinite(Number(body.discard_count))
      ? Math.max(0, Math.floor(Number(body.discard_count)))
      : 0;
    const bootsklassen = Array.isArray(body.bootsklassen) ? body.bootsklassen : [];

    if (!name) {
      return NextResponse.json({ error: "Name fehlt" }, { status: 400 });
    }

    const id = randomUUID();
    await sql`
      INSERT INTO championships
        (id, federation_id, name, level, scoring_mode, discard_count, bootsklassen)
      VALUES
        (${id}, ${auth.userId}, ${name}, ${level}, ${mode}, ${discardCount}, ${JSON.stringify(bootsklassen)})
    `;

    return NextResponse.json({ success: true, id });
  } catch (error) {
    console.error("POST championships error:", error);
    return NextResponse.json({ error: "Serverfehler" }, { status: 500 });
  }
}
