import { NextResponse } from "next/server";
import accounts from "./accounts.json";

// TypeScript Interfaces basierend auf deiner Struktur
interface BaseEntry {
  id: string;
  type: "verein" | "segler";
  email: string;
  passwort: string;
}

interface Verein extends BaseEntry {
  type: "verein";
  name: string;
  kuerzel: string;
}

interface Segler extends BaseEntry {
  type: "segler";
  vorname: string;
  nachname: string;
  geburtsjahr: string;
  nation: string; 
  vereine: string[]; // IDs
  worldSailingId?: string;
  lizenzNummer?: string;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  const allEntries = accounts as (Verein | Segler)[];

  // Hilfsfunktion: Sucht den Vereinsnamen/Kürzel anhand der ID
  const resolveVereinName = (vId: string) => {
    const v = allEntries.find(e => e.id === vId && e.type === "verein") as Verein;
    return v ? (v.kuerzel || v.name) : vId;
  };

  if (id) {
    const user = allEntries.find(u => u.id === id);

    if (!user) {
      return NextResponse.json({ error: "Nutzer nicht gefunden" }, { status: 404 });
    }

    // Falls es ein Segler ist, lösen wir die Vereins-IDs in Namen auf
    if (user.type === "segler") {
      const enrichedSegler = {
        ...user,
        vereinsNamen: user.vereine.map(vId => resolveVereinName(vId)),
        // Wir setzen 'verein' als String für dein Formular (erstes Element)
        verein: user.vereine.length > 0 ? resolveVereinName(user.vereine[0]) : ""
      };
      return NextResponse.json(enrichedSegler);
    }

    return NextResponse.json(user);
  }

  return NextResponse.json(allEntries);
}