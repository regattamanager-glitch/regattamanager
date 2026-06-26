import { NextResponse } from "next/server";
import sql from "@/lib/db";
import { requireAuth, forbidden } from "@/lib/auth";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

const VALID_METHODS = ["time_on_time", "time_on_distance"];

/**
 * GET /api/yardstick
 *   ?ownerType=verein|federation&ownerId=...  -> öffentliche Abfrage (read-only)
 *   (ohne Parameter)                          -> Konfiguration des eingeloggten Owners
 */
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    let ownerType = searchParams.get("ownerType");
    let ownerId = searchParams.get("ownerId");

    // Ohne Parameter: aus der Session ableiten (für die Verwaltung).
    if (!ownerType || !ownerId) {
      const auth = await requireAuth();
      if (auth instanceof NextResponse) return auth;
      if (auth.userType !== "verein" && auth.userType !== "federation") {
        return forbidden("Nur Vereine und Föderationen haben einen Yardstick");
      }
      ownerType = auth.userType;
      ownerId = auth.userId;
    }

    const cfgRows = await sql`
      SELECT method FROM yardstick_config
      WHERE owner_type = ${ownerType} AND owner_id = ${ownerId} LIMIT 1
    `;
    const valRows = await sql`
      SELECT klasse, coefficient FROM yardstick_values
      WHERE owner_type = ${ownerType} AND owner_id = ${ownerId}
    `;

    const values: Record<string, number> = {};
    for (const r of valRows as any[]) values[r.klasse] = Number(r.coefficient);

    return NextResponse.json({
      method: cfgRows[0]?.method || "time_on_time",
      values,
    });
  } catch (error) {
    console.error("GET yardstick error:", error);
    return NextResponse.json({ error: "Serverfehler" }, { status: 500 });
  }
}

/**
 * PUT /api/yardstick  body: { method, values: { klasse: coefficient } }
 * Speichert die Konfiguration des eingeloggten Owners (Verein/Föderation).
 */
export async function PUT(req: Request) {
  try {
    const auth = await requireAuth();
    if (auth instanceof NextResponse) return auth;
    if (auth.userType !== "verein" && auth.userType !== "federation") {
      return forbidden("Nur Vereine und Föderationen können den Yardstick setzen");
    }

    const ownerType = auth.userType;
    const ownerId = auth.userId;

    const body = await req.json().catch(() => ({}));
    const method = VALID_METHODS.includes(body.method) ? body.method : "time_on_time";
    const values = body.values && typeof body.values === "object" ? body.values : {};

    // Berechnungsart upsert
    await sql`
      INSERT INTO yardstick_config (owner_type, owner_id, method, updated_at)
      VALUES (${ownerType}, ${ownerId}, ${method}, NOW())
      ON CONFLICT (owner_type, owner_id)
      DO UPDATE SET method = EXCLUDED.method, updated_at = NOW()
    `;

    // Werte upsert (nur valide Zahlen)
    for (const [klasse, coeffRaw] of Object.entries(values)) {
      const coeff = Number(coeffRaw);
      if (!klasse || !Number.isFinite(coeff) || coeff <= 0) continue;
      await sql`
        INSERT INTO yardstick_values (owner_type, owner_id, klasse, coefficient, updated_at)
        VALUES (${ownerType}, ${ownerId}, ${klasse}, ${coeff}, NOW())
        ON CONFLICT (owner_type, owner_id, klasse)
        DO UPDATE SET coefficient = EXCLUDED.coefficient, updated_at = NOW()
      `;
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("PUT yardstick error:", error);
    return NextResponse.json({ error: "Serverfehler" }, { status: 500 });
  }
}
