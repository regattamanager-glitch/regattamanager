import { NextResponse } from "next/server";
// Import auf 'db' korrigiert
import { getPrisma } from "@/lib/prisma"; 
import { PrismaClient } from '@prisma/client';

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const db = getPrisma();
    // 'prisma' durch 'db' ersetzt
    const invitations = await db.loginCode.findMany({
      where: { 
        expires: { 
          gt: new Date() // Nur Codes anzeigen, die noch nicht abgelaufen sind
        } 
      },
      orderBy: {
        createdAt: 'desc' // Neueste Einladungen zuerst
      }
    });

    return NextResponse.json(invitations);
  } catch (error) {
    console.error("Einladungs-Fehler:", error);
    return NextResponse.json(
      { error: "Fehler beim Laden der Einladungen" },
      { status: 500 }
    );
  }
}