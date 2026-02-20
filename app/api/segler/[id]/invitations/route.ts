import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const userId = params.id;
  const invPath = path.join(process.cwd(), 'app/api/accounts/invitations.json');
  const eventsPath = path.join(process.cwd(), 'app/api/events/events.json'); // Pfad zu deinen Events

  if (!fs.existsSync(invPath)) return NextResponse.json([]);

  let invitations = JSON.parse(fs.readFileSync(invPath, 'utf8'));
  const events = JSON.parse(fs.readFileSync(eventsPath, 'utf8'));

  const now = new Date();

  // CLEANUP: Behalte nur Einladungen, deren Event-Datum noch in der Zukunft liegt
  const validInvitations = invitations.filter((inv: any) => {
    const event = events.find((e: any) => e.id === inv.eventId);
    if (!event) return false; // Event existiert nicht mehr
    
    const eventEndDate = new Date(event.datumBis);
    return eventEndDate >= now; // Behalten, wenn Event noch läuft oder kommt
  });

  // Falls sich was geändert hat, Datei aktualisieren
  if (validInvitations.length !== invitations.length) {
    fs.writeFileSync(invPath, JSON.stringify(validInvitations, null, 2));
  }

  // Rückgabe nur für den aktuellen User
  return NextResponse.json(validInvitations.filter((inv: any) => inv.to === userId));
} 
