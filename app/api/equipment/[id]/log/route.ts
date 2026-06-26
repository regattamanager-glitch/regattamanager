import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import sql from "@/lib/db";
import { requireAuth, forbidden } from "@/lib/auth";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

const LOG_TYPES = ["hours", "maintenance", "repair"];

async function assertOwner(id: string) {
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return { error: auth };
  const rows = await sql`SELECT owner_type, owner_id FROM equipment WHERE id = ${id} LIMIT 1`;
  if (rows.length === 0) return { error: NextResponse.json({ error: "Nicht gefunden" }, { status: 404 }) };
  if (String(rows[0].owner_type) !== auth.userType || String(rows[0].owner_id) !== String(auth.userId)) {
    return { error: forbidden("Keine Berechtigung") };
  }
  return { ok: true as const };
}

/** GET /api/equipment/[id]/log -> Historie (neueste zuerst). */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const owned = await assertOwner(id);
  if ("error" in owned) return owned.error;

  const rows = await sql`
    SELECT * FROM equipment_log WHERE equipment_id = ${id}
    ORDER BY logged_at DESC, created_at DESC
  `.catch(() => []);
  return NextResponse.json(rows);
}

/**
 * POST /api/equipment/[id]/log
 * body: { type, hours_added?, description?, logged_at? }
 * Bei type='hours' werden die Stunden auf das Material aufaddiert.
 */
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const owned = await assertOwner(id);
  if ("error" in owned) return owned.error;

  const b = await req.json().catch(() => ({}));
  const type = LOG_TYPES.includes(b.type) ? b.type : "maintenance";
  const hoursAdded = Number.isFinite(Number(b.hours_added)) ? Number(b.hours_added) : null;
  const description = b.description ? String(b.description) : null;

  if (type !== "hours" && !description) {
    return NextResponse.json({ error: "Beschreibung fehlt" }, { status: 400 });
  }

  const logId = randomUUID();
  await sql`
    INSERT INTO equipment_log (id, equipment_id, type, hours_added, description, logged_at)
    VALUES (${logId}, ${id}, ${type}, ${hoursAdded}, ${description}, ${b.logged_at || new Date().toISOString().slice(0, 10)})
  `;

  // Stunden aufs Material aufaddieren
  if (type === "hours" && hoursAdded && hoursAdded > 0) {
    await sql`UPDATE equipment SET hours = hours + ${hoursAdded}, updated_at = NOW() WHERE id = ${id}`;
  }

  return NextResponse.json({ success: true, id: logId });
}
