// app/api/accounts/session/route.ts
import fs from "fs";
import path from "path";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

type Account = {
  id: string;
  type: string;
  name: string;
  kuerzel?: string;
  adresse?: string;
  email: string; 
  passwort: string;
};

type Session = {
  id: string;
  userId: string;
  ua: string;
  ip: string;
  expires: number;
};

const accountsFile = path.join(process.cwd(), "app/api/accounts/accounts.json");
const sessionsFile = path.join(process.cwd(), "app/api/accounts/sessions.json");

export async function GET() {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get("session")?.value;

  if (!sessionId) return NextResponse.json(null, { status: 404 });

  if (!fs.existsSync(sessionsFile)) return NextResponse.json(null, { status: 404 });

  const sessions: Session[] = JSON.parse(fs.readFileSync(sessionsFile, "utf-8"));
  const session = sessions.find((s: Session) => s.id === sessionId && s.expires > Date.now());
  if (!session) return NextResponse.json(null, { status: 404 });

  const accounts: Account[] = JSON.parse(fs.readFileSync(accountsFile, "utf-8"));
  const user = accounts.find((u: Account) => u.id === session.userId);

  if (!user) return NextResponse.json(null, { status: 404 });

  return NextResponse.json(user);
}
