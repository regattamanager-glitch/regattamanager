import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import sql from "@/lib/db";
import { requireAuth, forbidden } from "@/lib/auth";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

const PART_TYPES = ["boat", "sail", "mast", "foil", "sheet", "foilboard", "other"];

/** GET /api/equipment -> Material des eingeloggten Owners (Segler/Verein). */
export async function GET() {
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;
  if (auth.userType !== "segler" && auth.userType !== "verein") {
    return forbidden("Nur Segler und Vereine haben Material");
  }

  const rows = await sql`
    SELECT * FROM equipment
    WHERE owner_type = ${auth.userType} AND owner_id = ${auth.userId}
    ORDER BY status ASC, part_type ASC, name ASC
  `.catch(() => []);

  return NextResponse.json(rows);
}

/** POST /api/equipment -> neues Material anlegen. */
export async function POST(req: Request) {
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;
  if (auth.userType !== "segler" && auth.userType !== "verein") {
    return forbidden("Nur Segler und Vereine können Material anlegen");
  }

  const body = await req.json().catch(() => ({}));
  const name = String(body.name || "").trim();
  if (!name) return NextResponse.json({ error: "Name fehlt" }, { status: 400 });

  const partType = PART_TYPES.includes(body.part_type) ? body.part_type : "other";
  const hours = Number.isFinite(Number(body.hours)) ? Math.max(0, Number(body.hours)) : 0;
  const serviceInterval = Number.isFinite(Number(body.service_interval_hours))
    ? Math.max(0, Number(body.service_interval_hours))
    : null;

  const id = randomUUID();
  await sql`
    INSERT INTO equipment
      (id, owner_type, owner_id, klasse, part_type, name, identifier, hours, purchased_at, service_interval_hours, notes)
    VALUES
      (${id}, ${auth.userType}, ${auth.userId}, ${body.klasse || null}, ${partType}, ${name},
       ${body.identifier || null}, ${hours}, ${body.purchased_at || null}, ${serviceInterval}, ${body.notes || null})
  `;

  return NextResponse.json({ success: true, id });
}
