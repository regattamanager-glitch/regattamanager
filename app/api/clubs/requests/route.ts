import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const clubId = searchParams.get('clubId');

  const requestsPath = path.join(process.cwd(), 'app', 'api', 'clubs', 'anfragen.json');
  const accountsPath = path.join(process.cwd(), 'app', 'api', 'accounts', 'accounts.json');

  try {
    const requestsData = await fs.readFile(requestsPath, 'utf-8');
    const accountsData = await fs.readFile(accountsPath, 'utf-8');
    
    const allRequests = JSON.parse(requestsData || '[]');
    const allAccounts = JSON.parse(accountsData || '[]');

    // 1. Filtern nach diesem Verein
    const clubRequests = allRequests.filter((r: any) => r.clubId === clubId);

    // 2. Anreichern mit echten Daten aus der accounts.json
    const enrichedRequests = clubRequests.map((req: any) => {
      // Suche den Segler-Account basierend auf der userId der Anfrage
      const user = allAccounts.find((acc: any) => acc.id === req.userId);
      
      return { 
        ...req,
        // Hier ziehen wir die echten Daten
        userName: user ? `${user.vorname} ${user.nachname}` : "Unbekannter Segler",
        userNation: user?.nation || "??",
        userEmail: user?.email || "Keine Email",
        userYear: user?.geburtsjahr || "N/A"
      };
    });

    return NextResponse.json(enrichedRequests);
  } catch (error) {
    return NextResponse.json([]);
  }
}