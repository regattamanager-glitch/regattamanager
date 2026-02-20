import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function POST(req: Request) {
  try {
    const { sessionId } = await req.json();
    const sessionsFile = path.join(process.cwd(), "app/api/accounts/sessions.json");

    if (fs.existsSync(sessionsFile)) {
      const sessions = JSON.parse(fs.readFileSync(sessionsFile, "utf-8"));
      const session = sessions.find((s: any) => s.id === sessionId && s.expires > Date.now());
      if (session) return NextResponse.json({ ok: true });
    }
    return NextResponse.json({ ok: false }, { status: 401 });
  } catch (e) {
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}