import { NextRequest, NextResponse } from 'next/server';
import sql from "@/lib/db";

export const GET = async (
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) => {
  try {
    const { id: userId } = await context.params;

    // Wir holen alle Event-Einladungen für diesen User,
    // aber nur wenn das Event-Enddatum (datum_bis) noch nicht in der Vergangenheit liegt.
    const validInvitations = await sql`
      SELECT 
        ei.*, 
        e.datum_bis as event_datum_bis
      FROM event_invitations ei
      JOIN events e ON ei.event_id = e.id
      WHERE ei.receiver_id = ${userId}
        AND e.datum_bis >= CURRENT_DATE
    `;

    // Mapping auf die CamelCase-Struktur deines Frontends
    const formatted = validInvitations.map((inv: any) => ({
      id: inv.id,
      senderId: inv.sender_id,
      receiverId: inv.receiver_id,
      eventId: inv.event_id,
      eventName: inv.event_name,
      status: inv.status,
      sentAt: inv.created_at || inv.timestamp
    }));

    return NextResponse.json(formatted);

  } catch (error) {
    console.error("API Error [Invitations GET SQL]:", error);
    return NextResponse.json([], { status: 500 });
  }
};