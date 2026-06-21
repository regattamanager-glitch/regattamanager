import { NextResponse } from "next/server";
import sql from "@/lib/db";
import { requireAuth, forbidden } from "@/lib/auth";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

/**
 * GET /api/events/yardstick?eventId=...
 * Öffentlich: liefert die Yardstick-Konfiguration einer Regatta
 * { klasse: { timeBased, fleetGroup } }
 */
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const eventId = searchParams.get("eventId");
    if (!eventId) return NextResponse.json({ error: "eventId fehlt" }, { status: 400 });

    const rows = await sql`
      SELECT klasse, time_based, fleet_group FROM event_yardstick WHERE event_id = ${eventId}
    `.catch(() => []);

    const config: Record<string, { timeBased: boolean; fleetGroup: string | null }> = {};
    for (const r of rows as any[]) {
      config[r.klasse] = { timeBased: !!r.time_based, fleetGroup: r.fleet_group || null };
    }
    return NextResponse.json({ config });
  } catch (error) {
    console.error("GET event yardstick error:", error);
    return NextResponse.json({ error: "Serverfehler" }, { status: 500 });
  }
}

/**
 * PUT /api/events/yardstick
 * body: { eventId, config: { klasse: { timeBased, fleetGroup } } }
 * Nur der ausrichtende Verein.
 */
export async function PUT(req: Request) {
  try {
    const auth = await requireAuth();
    if (auth instanceof NextResponse) return auth;

    const body = await req.json().catch(() => ({}));
    const eventId = body.eventId;
    const config = body.config && typeof body.config === "object" ? body.config : {};
    if (!eventId) return NextResponse.json({ error: "eventId fehlt" }, { status: 400 });

    const evRows = await sql`SELECT verein_id FROM events WHERE id = ${eventId} LIMIT 1`;
    if (evRows.length === 0) return NextResponse.json({ error: "Event nicht gefunden" }, { status: 404 });
    if (auth.userType !== "verein" || String(evRows[0].verein_id) !== String(auth.userId)) {
      return forbidden("Nur der ausrichtende Verein darf den Yardstick setzen");
    }

    for (const [klasse, cfgRaw] of Object.entries(config)) {
      const cfg = (cfgRaw || {}) as { timeBased?: boolean; fleetGroup?: string | null };
      const timeBased = !!cfg.timeBased;
      const fleetGroup = cfg.fleetGroup ? String(cfg.fleetGroup).trim() : null;
      await sql`
        INSERT INTO event_yardstick (event_id, klasse, time_based, fleet_group, updated_at)
        VALUES (${eventId}, ${klasse}, ${timeBased}, ${fleetGroup}, NOW())
        ON CONFLICT (event_id, klasse)
        DO UPDATE SET time_based = EXCLUDED.time_based,
                      fleet_group = EXCLUDED.fleet_group,
                      updated_at = NOW()
      `;
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("PUT event yardstick error:", error);
    return NextResponse.json({ error: "Serverfehler" }, { status: 500 });
  }
}
