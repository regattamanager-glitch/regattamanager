import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function GET() {
  const filePath = path.join(process.cwd(), "app/api/accounts/invitations.json");
  try {
    if (!fs.existsSync(filePath)) return NextResponse.json([]);
    const data = fs.readFileSync(filePath, "utf-8");
    return NextResponse.json(JSON.parse(data));
  } catch (error) {
    return NextResponse.json({ error: "Fehler beim Laden der Einladungen" }, { status: 500 });
  }
} 