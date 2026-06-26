import { NextResponse } from "next/server";
import sql from "@/lib/db";
import { requireAuth, forbidden, type AuthContext } from "@/lib/auth";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

async function ownedOr(id: string): Promise<{ auth: AuthContext } | { error: NextResponse }> {
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return { error: auth };
  const rows = await sql`SELECT owner_type, owner_id FROM equipment WHERE id = ${id} LIMIT 1`;
  if (rows.length === 0) return { error: NextResponse.json({ error: "Nicht gefunden" }, { status: 404 }) };
  if (String(rows[0].owner_type) !== auth.userType || String(rows[0].owner_id) !== String(auth.userId)) {
    return { error: forbidden("Keine Berechtigung") };
  }
  return { auth };
}

/** PATCH /api/equipment/[id] -> Felder aktualisieren. */
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const owned = await ownedOr(id);
  if ("error" in owned) return owned.error;

  const b = await req.json().catch(() => ({}));

  // Nur gesetzte Felder ändern (COALESCE auf den bestehenden Wert).
  await sql`
    UPDATE equipment SET
      name = COALESCE(${b.name ?? null}, name),
      klasse = COALESCE(${b.klasse ?? null}, klasse),
      part_type = COALESCE(${b.part_type ?? null}, part_type),
      identifier = COALESCE(${b.identifier ?? null}, identifier),
      hours = COALESCE(${b.hours ?? null}, hours),
      purchased_at = COALESCE(${b.purchased_at ?? null}, purchased_at),
      service_interval_hours = COALESCE(${b.service_interval_hours ?? null}, service_interval_hours),
      status = COALESCE(${b.status ?? null}, status),
      notes = COALESCE(${b.notes ?? null}, notes),
      updated_at = NOW()
    WHERE id = ${id}
  `;

  return NextResponse.json({ success: true });
}

/** DELETE /api/equipment/[id] -> Material + Log löschen. */
export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const owned = await ownedOr(id);
  if ("error" in owned) return owned.error;

  await sql`DELETE FROM equipment_log WHERE equipment_id = ${id}`;
  await sql`DELETE FROM equipment WHERE id = ${id}`;
  return NextResponse.json({ success: true });
}
