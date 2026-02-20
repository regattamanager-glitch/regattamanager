import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

export async function POST(request: Request) {
  try {
    const { clubId, userId } = await request.json();

    const accountsPath = path.join(process.cwd(), 'app', 'api', 'accounts', 'accounts.json');

    // 1. ACCOUNTS LADEN
    const accountsData = await fs.readFile(accountsPath, 'utf-8');
    let accounts = JSON.parse(accountsData);

    // 2. DATEN AKTUALISIEREN (IDs entfernen)
    accounts = accounts.map((acc: any) => {
      // Beim Segler: Verein aus der Liste löschen
      if (acc.id === userId && acc.vereine) {
        acc.vereine = acc.vereine.filter((id: string) => id !== clubId);
      }
      // Beim Verein: Segler aus der Liste löschen
      if (acc.id === clubId && acc.mitglieder) {
        acc.mitglieder = acc.mitglieder.filter((id: string) => id !== userId);
      }
      return acc;
    });

    // 3. SPEICHERN
    await fs.writeFile(accountsPath, JSON.stringify(accounts, null, 2), 'utf-8');
 
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Fehler beim Entfernen des Mitglieds:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}