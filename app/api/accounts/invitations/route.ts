import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma"; // Umgestellt auf direkten Export

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    // Wir nutzen jetzt direkt 'prisma'
    const invitations = await prisma.loginCode.findMany({
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
    console.error("Einladungs-Fehler in /api/accounts/invitations:", error);
    return NextResponse.json(
      { error: "Fehler beim Laden der Einladungen aus der Datenbank" },
      { status: 500 }
    );
  }
}