import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

export async function POST(request: Request) {
  try {
    const { requestId, clubId, userId } = await request.json();

    const accountsPath = path.join(process.cwd(), 'app', 'api', 'accounts', 'accounts.json');
    const requestsPath = path.join(process.cwd(), 'app', 'api', 'clubs', 'anfragen.json');

    // 1. ACCOUNTS LADEN
    const accountsData = await fs.readFile(accountsPath, 'utf-8');
    let accounts = JSON.parse(accountsData);

    // 2. DATEN AKTUALISIEREN
    accounts = accounts.map((acc: any) => {
      // FALL A: Der Segler (bekommt den Verein eingetragen)
      if (acc.id === userId) {
        // Falls "vereine" fehlt oder null ist, erstelle leeres Array
        if (!acc.vereine || !Array.isArray(acc.vereine)) {
          acc.vereine = [];
        }
        if (!acc.vereine.includes(clubId)) {
          acc.vereine.push(clubId);
        }
      }
 
      // FALL B: Der Verein (bekommt das Mitglied eingetragen)
      if (acc.id === clubId) {
        // Falls "mitglieder" fehlt (wichtig für neue Vereine!), erstelle leeres Array
        if (!acc.mitglieder || !Array.isArray(acc.mitglieder)) {
          acc.mitglieder = [];
        }
        if (!acc.mitglieder.includes(userId)) {
          acc.mitglieder.push(userId);
        }
      }
      return acc;
    });

    // 3. ANFRAGE AUS DER JSON ENTFERNEN
    let requests = [];
    try {
      const requestsData = await fs.readFile(requestsPath, 'utf-8');
      requests = JSON.parse(requestsData);
      requests = requests.filter((req: any) => req.id !== requestId);
    } catch (e) {
      console.log("Keine Anfragen-Datei gefunden oder leer.");
    }

    // 4. ALLES SPEICHERN
    await fs.writeFile(accountsPath, JSON.stringify(accounts, null, 2), 'utf-8');
    await fs.writeFile(requestsPath, JSON.stringify(requests, null, 2), 'utf-8');

    console.log(`✅ Mitgliedschaft besiegelt: User ${userId} <-> Club ${clubId}`);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("KRITISCHER FEHLER BEIM AKZEPTIEREN:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}