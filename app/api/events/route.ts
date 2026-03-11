import { NextResponse } from "next/server";
import sql from "@/lib/db";
import crypto from "crypto";

/* ================================================= */
/* ================== INTERFACES =================== */
/* ================================================= */

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
  gebuehrenProKlasse: Record<string, { normal: number; spaet: number }>;
  alleKlassen: boolean;
  bootsklassen: string[];
  anmeldungsZeitraum: { von: string; bis: string };
  latitude: number;
  longitude: number;
  createdAt: string;
  updatedAt: string;
}

/* ================================================= */
/* ================= GEO FUNCTION ================== */
/* ================================================= */

async function geocodeAddress(address: string) {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}`,
      { headers: { "User-Agent": "RegattaApp/1.0" } }
    );
    const data = await res.json();
    if (!data?.length) return null;
    return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
  } catch {
    return null;
  }
}

/* ================================================= */
/* ======================= GET ===================== */
/* ================================================= */

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const eventId = url.searchParams.get("eventId");
    const vId = url.searchParams.get("vereinId");

    let events: any[] = [];

    if (eventId && !vId) {
      events = await sql`SELECT * FROM events WHERE id = ${eventId}`;
    } else if (vId) {
      events = await sql`SELECT * FROM events WHERE verein_id = ${vId}`;
    } else {
      events = await sql`SELECT * FROM events`;
    }

    if (!events || events.length === 0) {
      return NextResponse.json([]);
    }

    const enrichedEvents = await Promise.all(events.map(async (event) => {
      try {
        const extrasRaw = await sql`SELECT * FROM event_extras WHERE event_id=${event.id}`.catch(() => []);
        const docsRaw = await sql`SELECT * FROM event_documents WHERE event_id=${event.id}`.catch(() => []);

        // Hilfsfunktion: Macht aus DB-Datum einen String "YYYY-MM-DD"
        const formatDate = (dateVal: any) => {
          if (!dateVal) return "";
          const d = new Date(dateVal);
          if (isNaN(d.getTime())) return "";
          return d.toISOString().split('T')[0];
        };

        const safeParse = (val: any, fallback: any) => {
          if (!val) return fallback;
          if (typeof val !== 'string') return val;
          try { return JSON.parse(val); } catch { return fallback; }
        };

        return {
          ...event,
          // 1. Haupt-Daten formatieren
          datumVon: formatDate(event.datum_von),
          datumBis: formatDate(event.datum_bis),
          land: event.land || "",
          location: event.location || "",
          privat: Boolean(event.privat),
          notiz: event.notiz || "",
          
          // 2. JSON-Felder parsen
          bootsklassen: safeParse(event.bootsklassen, []),
          gebuehrenProKlasse: safeParse(event.gebuehren_pro_klasse, {}),

          // 3. Anmeldungszeitraum als Objekt (WICHTIG für dein Frontend)
          anmeldungsZeitraum: {
            von: formatDate(event.anmeldungs_von),
            bis: formatDate(event.anmeldungs_bis)
          },

          // 4. Extras & Dokumente mappen
          extras: extrasRaw.map((ex: any) => ({
            name: ex.name || "Zusatzleistung",
            price: Number(ex.price) || 0
          })),
          documents: docsRaw.map((doc: any) => ({
            id: doc.id,
            name: doc.name || doc.title || "Dokument", 
            url: doc.url || ""
          }))
        };
      } catch (err) {
        console.error("Fehler beim Enrichen des Events:", event.id, err);
        return { 
          ...event, 
          extras: [], 
          documents: [], 
          anmeldungsZeitraum: { von: "", bis: "" },
          datumVon: "",
          datumBis: "" 
        };
      }
    }));

    if (eventId && !vId && enrichedEvents.length > 0) {
      return NextResponse.json(enrichedEvents[0]);
    }

    return NextResponse.json(enrichedEvents);

  } catch (error) {
    console.error("Kritischer API Fehler:", error);
    return NextResponse.json([], { status: 500 });
  }
}

/* ================================================= */
/* ======================= POST ==================== */
/* ================================================= */

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const id = crypto.randomUUID();

    let latitude = body.latitude || 0;
    let longitude = body.longitude || 0;

    if (body.location && !latitude) {
      const coords = await geocodeAddress(`${body.location}, ${body.land}`);
      if (coords) {
        latitude = coords.lat;
        longitude = coords.lng;
      }
    }

    await sql`
      INSERT INTO events
      (id, name, datum_von, datum_bis, land, location, verein_id, privat, notiz,
       gebuehren_pro_klasse, alle_klassen, bootsklassen,
       anmeldungs_von, anmeldungs_bis, latitude, longitude,
       created_at, updated_at)
      VALUES (
        ${id}, ${body.name}, ${body.datumVon}, ${body.datumBis}, ${body.land}, ${body.location}, 
        ${body.vereinId}, ${body.privat}, ${body.notiz || ""},
        ${JSON.stringify(body.gebuehrenProKlasse || {})},
        ${Boolean(body.alleKlassen)},
        ${JSON.stringify(body.bootsklassen || [])},
        ${body.anmeldungsZeitraum?.von || null},
        ${body.anmeldungsZeitraum?.bis || null},
        ${latitude}, ${longitude}, NOW(), NOW()
      )
    `;

    // Extras speichern (Tabelle: event_extras)
    if (body.extras?.length > 0) {
      for (const ex of body.extras) {
        await sql`INSERT INTO event_extras (id, event_id, name, price) 
                  VALUES (${crypto.randomUUID()}, ${id}, ${ex.name}, ${Number(ex.price)})`;
      }
    }

    // Dokumente speichern (Tabelle: event_documents)
    if (body.documents?.length > 0) {
      // FEHLERKORREKTUR: 'body.documents' statt 'documents'
      for (const doc of body.documents) {
        await sql`
          INSERT INTO event_documents (id, event_id, name, url, file_url, title)
          VALUES (
            ${crypto.randomUUID()}, 
            ${id}, -- FEHLERKORREKTUR: 'id' statt 'newEventId'
            ${doc.name}, 
            ${doc.url || '#'}, 
            ${doc.file_url || '#'}, 
            ${doc.name}
          )
        `;
      }
    }

    return NextResponse.json({ success: true, id });
  } catch (err) {
    console.error("POST Error:", err);
    return NextResponse.json({ success: false, error: err }, { status: 500 });
  }
}

/* ================================================= */
/* ======================== PUT ==================== */
/* ================================================= */

export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const { id } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: "Missing ID" }, { status: 400 });
    }

    // Hilfsfunktion: Falls ein Datum ein leerer String ist, zu null konvertieren
    const formatForDb = (dateStr: string) => (dateStr && dateStr.trim() !== "" ? dateStr : null);

    // Update Haupttabelle
    // Wir nutzen die Namen, die das Frontend sendet (datumVon, datumBis, etc.)
    await sql`
      UPDATE events SET
        name = ${body.name},
        datum_von = ${formatForDb(body.datumVon)},
        datum_bis = ${formatForDb(body.datumBis)},
        land = ${body.land},
        location = ${body.location},
        notiz = ${body.notiz || ""},
        privat = ${Boolean(body.privat)},
        gebuehren_pro_klasse = ${JSON.stringify(body.gebuehrenProKlasse || {})},
        bootsklassen = ${JSON.stringify(body.bootsklassen || [])},
        anmeldungs_von = ${formatForDb(body.anmeldungsZeitraum?.von)},
        anmeldungs_bis = ${formatForDb(body.anmeldungsZeitraum?.bis)},
        updated_at = NOW()
      WHERE id = ${id}
    `;

    // Extras synchronisieren: Erst alle alten löschen, dann neue rein
    await sql`DELETE FROM event_extras WHERE event_id = ${id}`;
    if (body.extras && Array.isArray(body.extras)) {
      for (const ex of body.extras) {
        if (ex.name) {
          await sql`
            INSERT INTO event_extras (id, event_id, name, price) 
            VALUES (${crypto.randomUUID()}, ${id}, ${ex.name}, ${Number(ex.price) || 0})
          `;
        }
      }
    }

    // Dokumente synchronisieren
await sql`DELETE FROM event_documents WHERE event_id = ${id}`;

if (body.documents && Array.isArray(body.documents)) {
  for (const doc of body.documents) {
    const documentUrl = doc.url || doc.link || "#";
    const documentName = doc.name || doc.title || "Dokument";

    if (documentUrl) {
      try {
        // Beispielhaft für deine route.ts PUT Methode:
        await sql`
          INSERT INTO event_documents (id, event_id, name, url, file_url, title)
          VALUES (
            ${crypto.randomUUID()}, 
            ${id}, -- FEHLERKORREKTUR: 'id' statt 'eventId'
            ${doc.name}, 
            ${doc.url || '#'}, 
            ${doc.file_url || doc.url || '#'}, 
            ${doc.name}
          )
        `;
        console.log("Gespeichert:", documentName);
      } catch (insertErr) {
        console.error("Fehler beim Speichern des Dokuments:", insertErr);
        throw insertErr; 
      }
    }
  }
}

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("PUT Error:", err);
    return NextResponse.json({ 
      success: false, 
      error: err instanceof Error ? err.message : "Unknown error" 
    }, { status: 500 });
  }
}

/* ================================================= */
/* ====================== DELETE =================== */
/* ================================================= */

export async function DELETE(req: Request) {
  const id = new URL(req.url).searchParams.get("id");
  if (!id)
    return NextResponse.json({ success: false }, { status: 400 });

  await sql`DELETE FROM events WHERE id=${id}`;
  return NextResponse.json({ success: true });
}