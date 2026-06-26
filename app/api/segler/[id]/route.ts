// app/api/segler/[id]/route.ts
import { NextResponse } from 'next/server';
import query from '@/lib/db';
import { requireAuth, stripSensitive } from '@/lib/auth';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  // Login erforderlich; Passwort-Hash & Reset-Token werden entfernt.
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;

  const { id } = await params;
  const result = await query`SELECT * FROM "Segler" WHERE id = ${id}`;

  return NextResponse.json(stripSensitive(result[0] || {}));
}