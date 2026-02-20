// app/api/events/results/route.ts
import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export const runtime = "nodejs"; // wichtig für fs

const resultsFolder = path.join(process.cwd(), "app/api/events/results");
const resultsFile = path.join(resultsFolder, "results.json");

function ensureFile() {
  if (!fs.existsSync(resultsFolder)) {
    fs.mkdirSync(resultsFolder, { recursive: true });
  }
  if (!fs.existsSync(resultsFile)) {
    fs.writeFileSync(resultsFile, JSON.stringify({}), "utf-8");
  }
}

function loadResults() {
  ensureFile();
  const content = fs.readFileSync(resultsFile, "utf-8");
  return JSON.parse(content);
}

function saveResults(data: any) {
  ensureFile();
  fs.writeFileSync(resultsFile, JSON.stringify(data, null, 2), "utf-8");
} 

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const eventId = url.searchParams.get("eventId");
    const klasse = url.searchParams.get("klasse");

    const existing = loadResults();

    // FALLS keine Parameter gesendet werden (Dashboard-Ansicht)
    if (!eventId || !klasse) {
      return NextResponse.json(existing); // Gibt das ganze Objekt zurück
    }

    // FALLS Parameter gesendet werden (Event-Detail-Ansicht)
    const classResults = existing[eventId]?.[klasse] || {};
    return NextResponse.json({
      success: true,
      results: classResults
    });

  } catch (err) {
    return NextResponse.json({ success: false, error: (err as Error).message });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { eventId, klasse, results } = await req.json();

    if (!eventId || !klasse || !Array.isArray(results)) {
      return NextResponse.json({
        success: false,
        error: "eventId, klasse oder results fehlen"
      });
    }

    const existing = loadResults();

    if (!existing[eventId]) {
      existing[eventId] = {};
    }

    if (!existing[eventId][klasse]) {
      existing[eventId][klasse] = {};
    }

    results.forEach((entry: any, idx: number) => {
      // Stelle sicher, dass entry.seglerId existiert
      if (!entry.seglerId) {
        console.warn("SeglerID fehlt bei Eintrag:", entry);
        return;
      }
    
      existing[eventId][klasse][entry.seglerId] = entry.scores;
    });

    saveResults(existing);

    return NextResponse.json({ success: true });

  } catch (err) {
    console.error("POST ERROR:", err);
    return NextResponse.json({
      success: false,
      error: (err as Error).message
    });
  }
}
