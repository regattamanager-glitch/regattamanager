import { NextResponse } from "next/server";
import { getPrisma } from "@/lib/prisma";
import { PrismaClient } from '@prisma/client';

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

export async function POST(req: Request) {
  try {
    const db = getPrisma();
    const { sessionId } = await req.json();

    if (!sessionId) return NextResponse.json({ ok: false }, { status: 400 });

    const session = await db.session.findUnique({
      where: { id: sessionId },
    });

    // In deinem Schema heißt es 'expires'
    if (!session || session.expires < new Date()) {
      return NextResponse.json({ ok: false }, { status: 401 });
    }

    // Wir prüfen, welcher User-Typ es ist, um in der richtigen Tabelle zu suchen
    let user = null;
    if (session.userType === "verein") {
      user = await db.verein.findUnique({ where: { id: session.userId } });
    } else {
      user = await db.segler.findUnique({ where: { id: session.userId } });
    }

    if (!user) return NextResponse.json({ ok: false }, { status: 401 });

    return NextResponse.json({ 
      ok: true, 
      user: { 
        id: user.id, 
        name: session.userType === "verein" ? (user as any).name : `${(user as any).vorname} ${(user as any).nachname}`,
        role: session.userType 
      } 
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}