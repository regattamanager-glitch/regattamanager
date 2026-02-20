import fs from "fs";
import path from "path";
import { cookies, headers } from "next/headers";
import { randomUUID } from "crypto";
import { NextResponse } from "next/server";

const accountsFile = path.join(process.cwd(), "app/api/accounts/accounts.json");
const codesFile = path.join(process.cwd(), "app/api/accounts/loginCodes.json");
const sessionsFile = path.join(process.cwd(), "app/api/accounts/sessions.json");

export async function POST(req: Request) {
  const { email, code } = await req.json();

  if (!email || !code) {
    return NextResponse.json({ success: false, message: "Fehlende Daten" }, { status: 400 });
  }
 
  // Lade alle Codes
  const codes = fs.existsSync(codesFile) ? JSON.parse(fs.readFileSync(codesFile, "utf-8")) : [];
  const entryIndex = codes.findIndex((c: any) => c.email === email && c.code === code);

  if (entryIndex === -1 || codes[entryIndex].expires < Date.now()) {
    return NextResponse.json({ success: false, message: "Code ungültig oder abgelaufen" });
  }

  const entry = codes[entryIndex];

  // Lade Accounts
  const accountsRaw = fs.existsSync(accountsFile) ? JSON.parse(fs.readFileSync(accountsFile, "utf-8")) : [];
  const accounts = accountsRaw.filter((u: any) => u && typeof u === "object" && u.email);

  // Prüfe, ob Account schon existiert (Login-Fall)
  let user = accounts.find((u: any) => u.email === email);

  if (!user) {
    // Registrierungs-Fall: Account aus entry.data speichern
    accounts.push(entry.data);
    fs.writeFileSync(accountsFile, JSON.stringify(accounts, null, 2));
    user = entry.data;
  }

  // Code aus loginCodes.json löschen
  codes.splice(entryIndex, 1);
  fs.writeFileSync(codesFile, JSON.stringify(codes, null, 2));

  // --- Session erstellen ---
  const sessionId = randomUUID();
  const h = await headers();
  const ua = h.get("user-agent") ?? "unknown";
  const ip = h.get("x-forwarded-for") ?? h.get("x-real-ip") ?? "unknown";
  const sessions = fs.existsSync(sessionsFile) ? JSON.parse(fs.readFileSync(sessionsFile, "utf-8")) : [];

  sessions.push({
    id: sessionId,
    userId: user.id,
    ua,
    ip,
    expires: Date.now() + 7 * 24 * 60 * 60 * 1000 // 7 Tage
  });
  fs.writeFileSync(sessionsFile, JSON.stringify(sessions, null, 2));

  // --- Cookie setzen ---
  const cookieStore = await cookies();
  cookieStore.set("session", sessionId, {
    httpOnly: true,
    secure: false, // lokal false, in Prod true
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7
  });

  return NextResponse.json({ success: true, type: user.type, id: user.id });
}
