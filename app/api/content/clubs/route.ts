import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
  try {
    const filePath = path.join(process.cwd(), 'app/api/accounts/accounts.json');
    if (!fs.existsSync(filePath)) return NextResponse.json([]);

    const allAccounts = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    // Filtert alle Accounts, die den Typ 'verein' haben
    const clubsOnly = allAccounts.filter((acc: any) => acc.type === 'verein');

    return NextResponse.json(clubsOnly);
  } catch (error) {
    return NextResponse.json([]);
  }
} 