import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
  try {
    // Navigiert zum korrekten Pfad in deinem Projekt
    const filePath = path.join(process.cwd(), 'app', 'api', 'accounts', 'invitations.json');
    
    if (!fs.existsSync(filePath)) {
      console.error("Datei nicht gefunden unter:", filePath);
      return NextResponse.json([]);
    }

    const fileData = fs.readFileSync(filePath, 'utf8');
    const data = JSON.parse(fileData);
    
    return NextResponse.json(data);
  } catch (error) {
    console.error("API Fehler:", error);
    return NextResponse.json([]);
  }
} 