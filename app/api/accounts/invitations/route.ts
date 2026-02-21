import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const invitations = await prisma.loginCode.findMany({
      where: { expires: { gt: new Date() } },
    });
    return NextResponse.json(invitations);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Fehler beim Laden der Einladungen" },
      { status: 500 }
    );
  }
}