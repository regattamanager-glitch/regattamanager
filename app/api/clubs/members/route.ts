import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const clubId = searchParams.get('clubId');

  const filePath = path.join(process.cwd(), 'app', 'api', 'accounts', 'accounts.json');

  try {
    const fileData = await fs.readFile(filePath, 'utf-8');
    const allAccounts = JSON.parse(fileData || '[]');

    // Wir filtern alle 'segler', die die clubId in ihrem 'vereine' Array haben
    const members = allAccounts.filter((acc: any) => 
      acc.type === 'segler' && 
      acc.vereine && 
      acc.vereine.includes(clubId)
    );

    return NextResponse.json(members);
  } catch (error) {
    return NextResponse.json([]);
  }
} 