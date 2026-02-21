import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get("session")?.value;

  if (!sessionId) return NextResponse.json(null, { status: 404 });

  const session = await prisma.session.findUnique({ where: { id: sessionId } });
  if (!session || session.expires < new Date()) return NextResponse.json(null, { status: 404 });

  const user =
    (await prisma.segler.findUnique({ where: { id: session.userId } })) ||
    (await prisma.verein.findUnique({ where: { id: session.userId } }));

  if (!user) return NextResponse.json(null, { status: 404 });

  return NextResponse.json(user);
}