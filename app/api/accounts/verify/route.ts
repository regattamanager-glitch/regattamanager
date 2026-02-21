import { randomUUID } from "crypto";
import { cookies, headers } from "next/headers";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const { email, code } = await req.json();
  if (!email || !code) return NextResponse.json({ success: false, message: "Fehlende Daten" }, { status: 400 });

  const entry = await prisma.loginCode.findFirst({
    where: { email, code },
  });

  if (!entry || entry.expires < new Date()) {
    return NextResponse.json({ success: false, message: "Code ungültig oder abgelaufen" });
  }

  let user =
    (await prisma.segler.findUnique({ where: { email } })) ||
    (await prisma.verein.findUnique({ where: { email } }));

  if (!user) {
    // Registrierungsfall
    if (entry.seglerId) {
      user = await prisma.segler.create({ data: { id: entry.seglerId, email, passwort: entry.code } });
    } else if (entry.vereinId) {
      user = await prisma.verein.create({ data: { id: entry.vereinId, email, passwort: entry.code } });
    }
  }

  // Code löschen
  await prisma.loginCode.delete({ where: { id: entry.id } });

  // Session erstellen
  const sessionId = randomUUID();
  const h = await headers();
  const ua = h.get("user-agent") ?? "unknown";
  const ip = h.get("x-forwarded-for") ?? h.get("x-real-ip") ?? "unknown";

  await prisma.session.create({
    data: {
      id: sessionId,
      userId: user.id,
      userType: user.type,
      userAgent: ua,
      ip,
      expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
  });

  const cookieStore = await cookies();
  cookieStore.set("session", sessionId, { httpOnly: true, sameSite: "lax", path: "/", maxAge: 7 * 24 * 60 * 60 });

  return NextResponse.json({ success: true, type: user.type, id: user.id });
}