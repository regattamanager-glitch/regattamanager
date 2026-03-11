import { NextResponse } from 'next/server';
import sql from "@/lib/db";
import crypto from "crypto";

export async function POST(req: Request) {
  try {
    const data = await req.json();
    const { userId, type, title, message, payload } = data;

    // Validierung
    if (!userId || !title) {
      return NextResponse.json({ error: "UserId und Titel sind erforderlich" }, { status: 400 });
    }

    const id = crypto.randomUUID();

    // In die Neon Datenbank speichern
    await sql`
      INSERT INTO notifications (id, user_id, type, title, message, payload, status, created_at)
      VALUES (
        ${id}, 
        ${userId}, 
        ${type || 'info'}, 
        ${title}, 
        ${message || null}, 
        ${JSON.stringify(payload || {})}, 
        'pending', 
        NOW()
      )
    `;

    const newRequest = {
      id,
      userId,
      type: type || 'info',
      title,
      message,
      payload,
      status: 'pending',
      createdAt: new Date().toISOString()
    };

    return NextResponse.json({ success: true, request: newRequest });

  } catch (error) {
    console.error("Notification Request Error:", error);
    return NextResponse.json({ error: "Fehler beim Erstellen der Benachrichtigung" }, { status: 500 });
  }
}