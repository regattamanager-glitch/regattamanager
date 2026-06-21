import { NextResponse } from "next/server";
import sql from "@/lib/db";
import { requireAuth, forbidden } from "@/lib/auth";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

// Prüft, dass die eingeloggte Föderation Eigentümer der Meisterschaft ist.
async function assertOwner(championshipId: string) {
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return { error: auth };

  const rows = await sql`SELECT federation_id FROM championships WHERE id = ${championshipId} LIMIT 1`;
  if (rows.length === 0) {
    return { error: NextResponse.json({ error: "Meisterschaft nicht gefunden" }, { status: 404 }) };
  }
  if (auth.userType !== "federation" || String(rows[0].federation_id) !== String(auth.userId)) {
    return { error: forbidden("Keine Berechtigung") };
  }
  return { auth };
}

/** POST /api/championships/[id]/events  body: { eventId } -> Regatta verknüpfen */
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const owner = await assertOwner(id);
    if (owner.error) return owner.error;

    const { eventId } = await req.json().catch(() => ({}));
    if (!eventId) {
      return NextResponse.json({ error: "eventId fehlt" }, { status: 400 });
    }

    // nächste Position bestimmen
    const posRows = await sql`
      SELECT COALESCE(MAX(position), 0) + 1 AS next FROM championship_events WHERE championship_id = ${id}
    `;
    const nextPos = Number(posRows[0]?.next || 1);

    await sql`
      INSERT INTO championship_events (championship_id, event_id, position)
      VALUES (${id}, ${eventId}, ${nextPos})
      ON CONFLICT (championship_id, event_id) DO NOTHING
    `;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("POST championship event error:", error);
    return NextResponse.json({ error: "Serverfehler" }, { status: 500 });
  }
}

/** DELETE /api/championships/[id]/events?eventId=... -> Regatta entfernen */
export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const owner = await assertOwner(id);
    if (owner.error) return owner.error;

    const { searchParams } = new URL(req.url);
    const eventId = searchParams.get("eventId");
    if (!eventId) {
      return NextResponse.json({ error: "eventId fehlt" }, { status: 400 });
    }

    await sql`
      DELETE FROM championship_events WHERE championship_id = ${id} AND event_id = ${eventId}
    `;
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE championship event error:", error);
    return NextResponse.json({ error: "Serverfehler" }, { status: 500 });
  }
}
