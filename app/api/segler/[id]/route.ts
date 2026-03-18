// app/api/segler/[id]/route.ts
import { NextResponse } from 'next/server';
import query from '@/lib/db';

export async function GET(request: Request, { params }: { params: { id: string } }) {
  const { id } = params;
  const result = await query`SELECT * FROM "Segler" WHERE id = ${id}`;
  
  // Logge das hier, um zu sehen, wie die Spalten wirklich heißen!
  console.log("Segler Daten aus DB:", result[0]); 
  
  return NextResponse.json(result[0] || {});
}