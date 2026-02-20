// app/api/segler/[id]/invitations/route.ts
import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export const GET = async (
  req: NextRequest,
  context: { params: Promise<{ id: string }> } // ✅ Promise
) => {
  const { id: userId } = await context.params; // ✅ Promise auflösen

  const invPath = path.join(process.cwd(), 'app/api/accounts/invitations.json');
  const eventsPath = path.join(process.cwd(), 'app/api/events/events.json');

  if (!fs.existsSync(invPath)) return NextResponse.json([]);

  const invitations = JSON.parse(fs.readFileSync(invPath, 'utf8'));
  const events = JSON.parse(fs.readFileSync(eventsPath, 'utf8'));

  const now = new Date();

  const validInvitations = invitations.filter((inv: any) => {
    const event = events.find((e: any) => e.id === inv.eventId);
    if (!event) return false;
    return new Date(event.datumBis) >= now;
  });

  if (validInvitations.length !== invitations.length) {
    fs.writeFileSync(invPath, JSON.stringify(validInvitations, null, 2));
  }

  return NextResponse.json(validInvitations.filter((inv: any) => inv.to === userId));
};
