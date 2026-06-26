import { NextResponse } from "next/server";
import sql from "@/lib/db";
import { requireAuth, forbidden } from "@/lib/auth";
import {
  computeRegattaPlacements,
  aggregateChampionship,
  type EventResult,
  type ScoringMode,
  type ScoringSystem,
} from "@/lib/scoring";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

function parseMaybeJson(val: any): any {
  if (val == null) return null;
  if (typeof val !== "string") return val;
  try {
    return JSON.parse(val);
  } catch {
    return null;
  }
}

/**
 * GET /api/championships/[id] -> Meisterschaft inkl. verknüpfter Regatten und
 * berechneter Gesamtwertung (pro Bootsklasse). Öffentlich lesbar.
 */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    const champRows = await sql`SELECT * FROM championships WHERE id = ${id} LIMIT 1`;
    const champ = champRows[0];
    if (!champ) {
      return NextResponse.json({ error: "Meisterschaft nicht gefunden" }, { status: 404 });
    }

    // Verknüpfte Regatten (mit Namen/Datum)
    // events.id ist uuid, championship_events.event_id ist text -> auf text casten.
    const linkedEvents = await sql`
      SELECT ce.event_id, ce.position, e.name, e.datum_von
      FROM championship_events ce
      LEFT JOIN events e ON e.id::text = ce.event_id
      WHERE ce.championship_id = ${id}
      ORDER BY ce.position ASC, e.datum_von ASC NULLS LAST
    `;

    // Welche Klassen werten wir? Konfigurierte Klassen, sonst alle aus den Ergebnissen.
    const configuredClasses: string[] = Array.isArray(champ.bootsklassen)
      ? champ.bootsklassen
      : parseMaybeJson(champ.bootsklassen) || [];

    const nameById = new Map<string, string>();

    // Wertungs-Konfiguration der Meisterschaft
    const racesPerDiscard = Number.isFinite(Number(champ.races_per_discard))
      ? Number(champ.races_per_discard)
      : 4;

    // Pro Klasse: pro Regatta die Platzierungen sammeln.
    const classSet = new Set<string>(configuredClasses);
    const perClassEvents: Record<string, EventResult[]> = {};

    for (const ev of linkedEvents) {
      const evId = ev.event_id;
      if (!evId) continue;

      const regs = await sql`
        SELECT "seglerId", klasse, skipper FROM registrations WHERE "eventId" = ${evId}
      `.catch(() => []);
      const res = await sql`
        SELECT segler_id, klasse, scores FROM results WHERE event_id = ${evId}
      `.catch(() => []);

      // Namen einsammeln
      for (const r of regs as any[]) {
        const sk = parseMaybeJson(r.skipper) || r.skipper || {};
        const sId = String(r.seglerId || sk.seglerId || "").trim();
        if (sId && sk?.name) nameById.set(sId, sk.name);
      }

      // Klassen bestimmen (falls nicht konfiguriert)
      const eventClasses = new Set<string>();
      (regs as any[]).forEach((r) => r.klasse && eventClasses.add(String(r.klasse)));
      (res as any[]).forEach((r) => r.klasse && eventClasses.add(String(r.klasse)));
      const classesToUse = configuredClasses.length ? configuredClasses : [...eventClasses];
      classesToUse.forEach((c) => classSet.add(c));

      for (const klasse of classesToUse) {
        const participantIds = new Set<string>();
        (regs as any[])
          .filter((r) => String(r.klasse) === klasse)
          .forEach((r) => {
            const sk = parseMaybeJson(r.skipper) || r.skipper || {};
            const sId = String(r.seglerId || sk.seglerId || "").trim();
            if (sId) participantIds.add(sId);
          });

        const resultsMap: Record<string, string[]> = {};
        (res as any[])
          .filter((r) => String(r.klasse) === klasse)
          .forEach((r) => {
            const sId = String(r.segler_id).trim();
            participantIds.add(sId);
            resultsMap[sId] = parseMaybeJson(r.scores) || r.scores || [];
          });

        if (participantIds.size === 0) continue;

        const placements = computeRegattaPlacements([...participantIds], resultsMap, racesPerDiscard);
        if (!perClassEvents[klasse]) perClassEvents[klasse] = [];
        perClassEvents[klasse].push({
          eventId: evId,
          placements,
          participantCount: participantIds.size,
        });
      }
    }

    // Aggregation pro Klasse
    const mode = (champ.scoring_mode as ScoringMode) || "sum";
    const discardCount = Number(champ.discard_count) || 0;
    const system = (champ.scoring_system as ScoringSystem) || "low_point";

    const standings = [...classSet].sort().map((klasse) => {
      const evs = perClassEvents[klasse] || [];
      const rows = aggregateChampionship(evs, mode, discardCount, system).map((row) => ({
        ...row,
        name: nameById.get(row.seglerId) || row.seglerId.slice(0, 8),
      }));
      // Nur die Regatten dieser Klasse – in der gleichen Reihenfolge wie perEvent.
      const events = evs.map((er) => {
        const le = (linkedEvents as any[]).find((l) => String(l.event_id) === String(er.eventId));
        return { eventId: er.eventId, name: le?.name ?? null, datumVon: le?.datum_von ?? null };
      });
      return { klasse, events, rows };
    }).filter((s) => s.rows.length > 0);

    return NextResponse.json({
      championship: {
        id: champ.id,
        federationId: champ.federation_id,
        name: champ.name,
        level: champ.level,
        scoringMode: champ.scoring_mode,
        discardCount: champ.discard_count,
        scoringSystem: system,
        racesPerDiscard,
        bootsklassen: configuredClasses,
      },
      events: linkedEvents.map((e: any) => ({
        eventId: e.event_id,
        name: e.name,
        datumVon: e.datum_von,
      })),
      standings,
    });
  } catch (error) {
    console.error("GET championship detail error:", error);
    return NextResponse.json({ error: "Serverfehler" }, { status: 500 });
  }
}

/** DELETE /api/championships/[id] -> nur durch die besitzende Föderation. */
export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const auth = await requireAuth();
    if (auth instanceof NextResponse) return auth;

    const rows = await sql`SELECT federation_id FROM championships WHERE id = ${id} LIMIT 1`;
    if (rows.length === 0) {
      return NextResponse.json({ error: "Nicht gefunden" }, { status: 404 });
    }
    if (auth.userType !== "federation" || String(rows[0].federation_id) !== String(auth.userId)) {
      return forbidden("Keine Berechtigung");
    }

    await sql`DELETE FROM championship_events WHERE championship_id = ${id}`;
    await sql`DELETE FROM championships WHERE id = ${id}`;
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE championship error:", error);
    return NextResponse.json({ error: "Serverfehler" }, { status: 500 });
  }
}

/** PATCH /api/championships/[id] -> Einstellungen ändern (nur besitzende Föderation). */
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const auth = await requireAuth();
    if (auth instanceof NextResponse) return auth;

    const rows = await sql`SELECT federation_id FROM championships WHERE id = ${id} LIMIT 1`;
    if (rows.length === 0) {
      return NextResponse.json({ error: "Nicht gefunden" }, { status: 404 });
    }
    if (auth.userType !== "federation" || String(rows[0].federation_id) !== String(auth.userId)) {
      return forbidden("Keine Berechtigung");
    }

    const body = await req.json().catch(() => ({}));

    if (Array.isArray(body.bootsklassen)) {
      const klassen = body.bootsklassen.filter((b: any) => typeof b === "string" && b.trim());
      await sql`
        UPDATE championships
        SET bootsklassen = ${JSON.stringify(klassen)}, updated_at = NOW()
        WHERE id = ${id}
      `;
    }

    if (["low_point", "high_point", "bonus_point"].includes(body.scoring_system)) {
      await sql`
        UPDATE championships
        SET scoring_system = ${body.scoring_system}, updated_at = NOW()
        WHERE id = ${id}
      `;
    }

    if (Number.isFinite(Number(body.races_per_discard))) {
      const rpd = Math.max(0, Math.floor(Number(body.races_per_discard)));
      await sql`
        UPDATE championships
        SET races_per_discard = ${rpd}, updated_at = NOW()
        WHERE id = ${id}
      `;
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("PATCH championship error:", error);
    return NextResponse.json({ error: "Serverfehler" }, { status: 500 });
  }
}
