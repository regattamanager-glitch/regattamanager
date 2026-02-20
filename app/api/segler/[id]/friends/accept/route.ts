import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function POST(req: Request) {
  try {
    const { userId, friendId } = await req.json();
    const filePath = path.join(process.cwd(), 'app/api/accounts/accounts.json');
    
    // 1. Datei einlesen
    const fileData = fs.readFileSync(filePath, 'utf8');
    let accounts = JSON.parse(fileData);

    // 2. Beide Segler in der Liste finden
    const userIndex = accounts.findIndex((a: any) => a.id === userId);
    const friendIndex = accounts.findIndex((a: any) => a.id === friendId);

    if (userIndex === -1 || friendIndex === -1) {
      return NextResponse.json({ error: "Einer der Segler wurde nicht gefunden" }, { status: 404 });
    }

    // 3. Feld "freunde" initialisieren, falls es noch nicht existiert (Beidseitig)
    if (!accounts[userIndex].freunde) {
      accounts[userIndex].freunde = [];
    }
    if (!accounts[friendIndex].freunde) {
      accounts[friendIndex].freunde = [];
    } 

    // 4. IDs gegenseitig hinzufügen (nur wenn sie nicht schon drin sind)
    if (!accounts[userIndex].freunde.includes(friendId)) {
      accounts[userIndex].freunde.push(friendId);
    }
    if (!accounts[friendIndex].freunde.includes(userId)) {
      accounts[friendIndex].freunde.push(userId);
    }

    // 5. Zurück in die JSON-Datei schreiben
    fs.writeFileSync(filePath, JSON.stringify(accounts, null, 2));

    return NextResponse.json({ 
      success: true, 
      message: "Freundschaft im Logbuch eingetragen" 
    });

  } catch (error) {
    console.error("Fehler beim Verarbeiten der Freundschaft:", error);
    return NextResponse.json({ error: "Server Fehler" }, { status: 500 });
  }
}