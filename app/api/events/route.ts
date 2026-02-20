import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import crypto from "crypto";

const filePath = path.join(process.cwd(), "app/api/events/events.json");

// --- INTERFACES ---

interface SeglerAnmeldung {
  skipper: {
    seglerId: string;
    name: string;
    nation: string;
    verein?: string;
    email?: string;
    telefon?: string;
    geschlecht?: "m" | "w" | "d";
    lizenzNummer?: string;
    geburtsdatum?: string;
  };
  boot: {
    bootName?: string;
    segelnummer: string;
    countryCode: string;
    bootsklasse?: string;
  }; 
  crew: any[];
  extras: {
    name: string;
    price: number;
    quantity: number;
  }[];
  paidAt: string;
  bezahlt: boolean;
  paymentIntent?: string | null;
}

interface EventData {
  id: string;
  name: string;
  datumVon: string;
  datumBis: string;
  land: string;
  location: string;
  vereinId: string;
  privat: boolean;
  notiz: string;
  gebuehrenProKlasse: { 
    [klasse: string]: { normal: number; spaet: number } 
  };
  alleKlassen: boolean;
  bootsklassen: string[];
  extras: { name: string; price: number }[];
  documents: { id: string; name: string; url: string }[]; 
  segler: {
    [bootsklasse: string]: SeglerAnmeldung[];
  };
  anmeldungsZeitraum: { von: string; bis: string };
  latitude: number; 
  longitude: number;
  createdAt: string;
  updatedAt: string;
}

// --- HELPER FUNKTIONEN ---

function loadEvents(): EventData[] {
  try {
    if (!fs.existsSync(filePath)) {
      const dir = path.dirname(filePath);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(filePath, "[]");
    }
    return JSON.parse(fs.readFileSync(filePath, "utf-8"));
  } catch (err) {
    console.error("Fehler beim Laden der Events:", err);
    return [];
  }
}

function saveEvents(events: EventData[]) {
  fs.writeFileSync(filePath, JSON.stringify(events, null, 2));
}

async function geocodeAddress(address: string): Promise<{ lat: number; lng: number } | null> {
  try {
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}`;
    const res = await fetch(url, { headers: { "User-Agent": "RegattaApp/1.0" } });
    const data = await res.json();
    if (!data || data.length === 0) return null;
    return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
  } catch (err) {
    console.error("Geocoding error:", err);
    return null;
  }
}

// --- API ROUTEN ---

/**
 * GET: Einzelnes Event, Events eines Vereins oder alle Events abrufen
 */
export async function GET(req: Request) {
  const events = loadEvents();
  const url = new URL(req.url);
  const eventId = url.searchParams.get("eventId");
  const vereinId = url.searchParams.get("vereinId");

  if (eventId) {
    const found = events.find(e => e.id === eventId);
    return found ? NextResponse.json(found) : NextResponse.json({ error: "Nicht gefunden" }, { status: 404 });
  }
  if (vereinId) {
    return NextResponse.json(events.filter(e => e.vereinId === vereinId));
  }
  return NextResponse.json(events);
}

/**
 * POST: Neues Event erstellen
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const isAll = body.alleKlassen === true || body.bootsklassen?.includes("ALL");
    const bootsklassen = isAll ? [] : (body.bootsklassen || []);
    
    // Segler-Listen initialisieren
    const segler: { [key: string]: SeglerAnmeldung[] } = {};
    if (isAll) segler["GLOBAL"] = [];
    else bootsklassen.forEach((cls: string) => { segler[cls] = []; });

    // Gebühren vereinheitlichen
    let finalFees: any = body.gebuehrenProKlasse || {};
    if (body.gebuehrNormal) {
      finalFees["GLOBAL"] = { 
        normal: Number(body.gebuehrNormal), 
        spaet: Number(body.gebuehrSpaet || body.gebuehrNormal) 
      };
    }

    const newEvent: EventData = {
      id: crypto.randomUUID(),
      name: body.name || "Unbenannte Regatta",
      datumVon: body.datumVon,
      datumBis: body.datumBis,
      land: body.land,
      location: body.location,
      vereinId: body.vereinId,
      privat: !!body.privat,
      notiz: body.notiz || "",
      alleKlassen: isAll,
      bootsklassen: bootsklassen,
      gebuehrenProKlasse: finalFees,
      extras: body.extras?.map((e: any) => ({ name: e.name, price: Number(e.price) })) || [],
      documents: (body.documents || []).map((d: any) => ({ id: crypto.randomUUID(), name: d.name, url: d.url })),
      segler: segler,
      anmeldungsZeitraum: { 
        von: body.anmeldungVon || body.anmeldungsZeitraum?.von || "", 
        bis: body.anmeldungBis || body.anmeldungsZeitraum?.bis || "" 
      },
      latitude: 0, 
      longitude: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    if (newEvent.location) {
      const coords = await geocodeAddress(`${newEvent.location}, ${newEvent.land}`);
      if (coords) { 
        newEvent.latitude = coords.lat; 
        newEvent.longitude = coords.lng; 
      }
    }

    const events = loadEvents();
    events.push(newEvent);
    saveEvents(events);
    return NextResponse.json({ success: true, event: newEvent });
  } catch (err) {
    return NextResponse.json({ success: false, message: "Fehler beim Erstellen" }, { status: 500 });
  }
}

/**
 * PUT: Event aktualisieren, Segler registrieren oder abmelden
 */
export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const { id, action, seglerId, bootsklasse } = body;
    if (!id) return NextResponse.json({ success: false, message: "ID fehlt" }, { status: 400 });

    const events = loadEvents();
    const index = events.findIndex(e => e.id === id);
    if (index === -1) return NextResponse.json({ success: false, message: "Nicht gefunden" }, { status: 404 });

    const event = events[index];

    // --- Aktionen ---

    // --- Aktionen ---

    if (action === "register") {
  const registrationData = body.data; 
  const klasse = registrationData.bootsklasse;
  const currentSeglerId = registrationData.skipper.seglerId; // ID aus den Meldedaten ziehen

  // ... (deine bestehende Logik zum Hinzufügen des Seglers zum Event)
  if (!event.segler) event.segler = {};
  if (!event.segler[klasse]) event.segler[klasse] = [];

  const alreadyRegistered = event.segler[klasse].some(
    (s: any) => s.skipper.seglerId === currentSeglerId
  );

  if (!alreadyRegistered) {
    event.segler[klasse].push(registrationData);
    
    // --- NEU: EINLADUNG LÖSCHEN ---
    try {
      const invPath = path.join(process.cwd(), 'app/api/accounts/invitations.json');
      if (fs.existsSync(invPath)) {
        const invitations = JSON.parse(fs.readFileSync(invPath, 'utf8'));
        
        // Entferne Einladungen, die diesen Segler UND dieses Event betreffen
        const filteredInvites = invitations.filter((inv: any) => 
          !(inv.to === currentSeglerId && inv.eventId === id)
        );
        
        fs.writeFileSync(invPath, JSON.stringify(filteredInvites, null, 2));
        console.log(`🧹 Einladungen für Segler ${currentSeglerId} zu Event ${id} bereinigt.`);
      }
    } catch (invErr) {
      console.error("Fehler beim Bereinigen der Einladungen:", invErr);
      // Wir werfen keinen Fehler, damit die Registrierung trotzdem klappt
    }
    // --- ENDE NEU ---

    console.log(`✅ Segler ${registrationData.skipper.name} in Klasse ${klasse} hinzugefügt.`);
  }
}
    else if (action === "unregister") {
      // Abmeldung für eine spezifische Klasse
      if (event.segler && event.segler[bootsklasse]) {
        event.segler[bootsklasse] = event.segler[bootsklasse].filter(
          (s: any) => s.seglerId !== seglerId
        );
      }
    } 
    // 3. ALLGEMEINES UPDATE ... (der Rest bleibt wie er ist)
    else {
      // Standort / Geocoding
      if (body.location && body.location !== event.location) {
        const coords = await geocodeAddress(`${body.location}, ${body.land || event.land}`);
        if (coords) { event.latitude = coords.lat; event.longitude = coords.lng; }
      }

      // Bootsklassen & Gebühren (Wichtig: Feldnamen müssen zum Frontend passen)
      // Wir prüfen auf 'gebuehrenProKlasse', da das Frontend dies sendet
      if (body.gebuehrenProKlasse) {
        event.gebuehrenProKlasse = body.gebuehrenProKlasse;
        // Aktualisiere auch die Liste der Bootsklassen-Namen
        event.bootsklassen = Object.keys(body.gebuehrenProKlasse);
      }

      // Extras speichern
      if (body.extras) {
        event.extras = body.extras.map((e: any) => ({
          name: e.name,
          price: Number(e.price)
        }));
      }

      // Dokumente
      if (body.documents) {
        event.documents = body.documents.map((d: any) => ({ 
          id: d.id || crypto.randomUUID(), 
          name: d.name, 
          url: d.url 
        }));
      }

      // Standard-Felder (Mapping der flachen Struktur vom Frontend auf das Event-Objekt)
      event.name = body.name ?? event.name;
      event.datumVon = body.datumVon ?? event.datumVon;
      event.datumBis = body.datumBis ?? event.datumBis;
      event.land = body.land ?? event.land;
      event.location = body.location ?? event.location;
      event.notiz = body.notiz ?? event.notiz;
      event.privat = body.privat ?? event.privat;

      // Anmeldungszeitraum (Frontend sendet anmeldungVon/Bis flach)
      event.anmeldungsZeitraum = {
        von: body.anmeldungVon ?? body.anmeldungsZeitraum?.von ?? event.anmeldungsZeitraum.von,
        bis: body.anmeldungBis ?? body.anmeldungsZeitraum?.bis ?? event.anmeldungsZeitraum.bis,
      };
    }

    event.updatedAt = new Date().toISOString();
    saveEvents(events);
    return NextResponse.json({ success: true, event });
  } catch (err) {
    console.error("PUT Error:", err);
    return NextResponse.json({ success: false, message: "Update Fehler" }, { status: 500 });
  }
}

/**
 * DELETE: Event löschen
 */
export async function DELETE(req: Request) {
  const id = new URL(req.url).searchParams.get("id");
  if (!id) return NextResponse.json({ success: false }, { status: 400 });
  
  const events = loadEvents();
  const filtered = events.filter(e => e.id !== id);
  saveEvents(filtered);
  
  return NextResponse.json({ success: true });
}