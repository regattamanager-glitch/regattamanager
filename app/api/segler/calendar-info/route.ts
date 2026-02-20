import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const seglerId = searchParams.get("seglerId");

  if (!seglerId) return NextResponse.json({ error: "ID fehlt" }, { status: 400 });

  try {
    const accountsPath = path.join(process.cwd(), "app/api/accounts/accounts.json");
    const invitesPath = path.join(process.cwd(), "app/api/accounts/invitations.json");

    // 1. Freunde laden
    let friends: string[] = [];
    if (fs.existsSync(accountsPath)) {
      const accounts = JSON.parse(fs.readFileSync(accountsPath, "utf-8"));
      const user = accounts.find((a: any) => String(a.id) === String(seglerId));
      friends = user?.friends || [];
    }

    // 2. Einladungen laden + DIAGNOSE
    let invitations: any[] = [];
    // In deiner route.ts im Bereich // 2. Einladungen laden:
if (fs.existsSync(invitesPath)) {
  const allInvites = JSON.parse(fs.readFileSync(invitesPath, "utf-8"));
  
  invitations = allInvites.filter((inv: any) => {
    // Wir nutzen jetzt receiverId, wie in deiner JSON gesehen
    const targetSegler = inv.receiverId; 
    
    // Vergleich mit der seglerId aus der URL 
    const isMatch = String(targetSegler) === String(seglerId);
    
    if (isMatch) {
      console.log(`✅ EINLADUNG GEFUNDEN: Event '${inv.eventName}' (ID: ${inv.eventId})`);
    }
    return isMatch;
  });
}

    return NextResponse.json({ friends, invitations });
  } catch (err) {
    console.error("Kritischer Fehler in API:", err);
    return NextResponse.json({ friends: [], invitations: [] });
  }
}