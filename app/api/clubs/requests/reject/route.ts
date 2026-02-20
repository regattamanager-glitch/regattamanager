import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

export async function POST(request: Request) {
  try {
    const { requestId } = await request.json();
    const requestsPath = path.join(process.cwd(), 'app', 'api', 'clubs', 'anfragen.json');

    const data = await fs.readFile(requestsPath, 'utf-8');
    let requests = JSON.parse(data);
    requests = requests.filter((req: any) => req.id !== requestId);

    await fs.writeFile(requestsPath, JSON.stringify(requests, null, 2), 'utf-8');
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
} 