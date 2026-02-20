import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function POST(req: Request) {
  const data = await req.json();
  
  // Pfad zu deiner JSON-Datenbank (falls du lokal speicherst)
  const filePath = path.join(process.cwd(), 'data', 'notifications.json');
  
  const fileData = fs.readFileSync(filePath, 'utf8');
  const notifications = JSON.parse(fileData);

  const newRequest = {
    id: Date.now().toString(),
    ...data,
    status: 'pending',
    createdAt: new Date().toISOString()
  };

  notifications.push(newRequest);
  fs.writeFileSync(filePath, JSON.stringify(notifications, null, 2));

  return NextResponse.json({ success: true, request: newRequest });
} 