import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");

  const segler = await prisma.segler.findMany({ include: { vereine: true } });
  const vereine = await prisma.verein.findMany();

  if (id) {
    const user = segler.find((s) => s.id === id) || vereine.find((v) => v.id === id);
    if (!user) return NextResponse.json({ error: "Nutzer nicht gefunden" }, { status: 404 });

    if ("vorname" in user) {
      return NextResponse.json({
        ...user,
        vereinsNamen: user.vereine.map((v) => v.kuerzel || v.name),
        verein: user.vereine.length > 0 ? user.vereine[0].kuerzel || user.vereine[0].name : "",
      });
    }

    return NextResponse.json(user);
  }

  return NextResponse.json([...segler, ...vereine]);
}