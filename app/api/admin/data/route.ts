import { NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const sql = neon(process.env.DATABASE_URL || "");

export async function GET(request: Request) {
  try {
    if (!process.env.DATABASE_URL) {
      throw new Error("DATABASE_URL ist nicht definiert.");
    }

    // URL-Parameter für die Tage auslesen (Standard: 30 Tage)
    const { searchParams } = new URL(request.url);
    const daysParam = searchParams.get("days") || "30";

    console.log(`=== START ADMIN API FETCH (Filter: ${daysParam} Tage, Kumuliert) ===`);

    // 1. Einfache Zähler abfragen
    let seglerCount = 0, vereineCount = 0, eventsCount = 0;
    try {
      const res = await sql`SELECT COUNT(*)::int as count FROM "Segler"`;
      seglerCount = res[0]?.count || 0;
    } catch (e) { console.error("[SQL ERROR] Segler Count:", e); }

    try {
      const res = await sql`SELECT COUNT(*)::int as count FROM "Verein"`;
      vereineCount = res[0]?.count || 0;
    } catch (e) { console.error("[SQL ERROR] Verein Count:", e); }

    try {
      const res = await sql`SELECT COUNT(*)::int as count FROM events`;
      eventsCount = res[0]?.count || 0;
    } catch (e) { console.error("[SQL ERROR] Events Count:", e); }


    // 2. Vereine abfragen
    let vereine: any[] = [];
    try {
      vereine = await sql`
        SELECT id, name, kuerzel, email, "stripeAccountId", "isApproved" 
        FROM "Verein" 
        ORDER BY name ASC
      `;
    } catch (e) { console.error("[SQL ERROR] Vereine Select:", e); }


    // 3. Rohdaten laden
    let eventsRaw: any[] = [];
    let registrationsRaw: any[] = [];

    try {
      eventsRaw = await sql`SELECT id, name, datum_von, datum_bis, gebuehren_pro_klasse FROM events`;
    } catch (e) { console.error("[SQL ERROR] Events Raw:", e); }

    try {
      registrationsRaw = await sql`SELECT id, "eventId", klasse, extras, "paidAt" FROM registrations`;
    } catch (e) { console.error("[SQL ERROR] Registrations Raw:", e); }


    // Vorbereitungen für Zeitberechnungen
    const heute = new Date();
    const dailyRevenueMap: Record<string, number> = {};
    const seglerDailyMap: Record<string, number> = {};
    
    // Wir tracken das absolut älteste Datum in der DB für den Fall "all"
    let aeltestesDatum = new Date();
    aeltestesDatum.setDate(aeltestesDatum.getDate() - 30); // Fallback-Minimum 30 Tage

    // 4. Rohe Seglerdaten laden und tagesbasiert vorsortieren
    let seglerRaw: any[] = [];
    try {
      seglerRaw = await sql`SELECT "createdAt" FROM "Segler" WHERE "createdAt" IS NOT NULL`;
    } catch (e) { 
      console.error("[SQL ERROR] Segler Zeitverlauf Select:", e); 
    }

    seglerRaw.forEach((s: any) => {
      if (!s || !s.createdAt) return;
      const d = s.createdAt instanceof Date ? s.createdAt : new Date(String(s.createdAt).trim());
      
      if (!isNaN(d.getTime())) {
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        const dateStr = `${year}-${month}-${day}`;
        
        seglerDailyMap[dateStr] = (seglerDailyMap[dateStr] || 0) + 1;

        if (d < aeltestesDatum) {
          aeltestesDatum = new Date(d);
        }
      }
    });

    // 5. Umsatzberechnung aggregieren
    const events = eventsRaw.map((event) => {
      let gebuehren: Record<string, any> = {};
      if (event.gebuehren_pro_klasse) {
        if (typeof event.gebuehren_pro_klasse === "string") {
          try { gebuehren = JSON.parse(event.gebuehren_pro_klasse); } catch (e) {}
        } else if (typeof event.gebuehren_pro_klasse === "object") {
          gebuehren = event.gebuehren_pro_klasse;
        }
      }

      const eventRegs = registrationsRaw.filter(
        (r) => String(r.eventId) === String(event.id)
      );
      
      let totalAdminRevenue = 0;

      eventRegs.forEach((reg: any) => {
        let regattaGebuehr = 0;
        if (gebuehren[reg.klasse]) {
          const klassenInfo = gebuehren[reg.klasse];
          const roherPreis = klassenInfo.preis || klassenInfo.price || klassenInfo.spaet || klassenInfo.amount || klassenInfo;
          regattaGebuehr = parseFloat(roherPreis || "0");
        }

        let extrasSumme = 0;
        if (reg.extras) {
          let extrasList: any[] = [];
          if (typeof reg.extras === "string") {
            try { extrasList = JSON.parse(reg.extras); } catch (e) {}
          } else if (Array.isArray(reg.extras)) {
            extrasList = reg.extras;
          }

          if (Array.isArray(extrasList)) {
            extrasList.forEach((extra: any) => {
              const preis = parseFloat(extra.price || extra.preis || 0);
              const anzahl = parseInt(extra.quantity || extra.anzahl || extra.amount || 1, 10);
              extrasSumme += preis * anzahl;
            });
          }
        }

        const systemGebuehr8Prozent = (regattaGebuehr + extrasSumme) * 0.08;
        const gesamtBetrag = (regattaGebuehr + extrasSumme) * 1.08;
        const abzuege = 0.25 + (gesamtBetrag * 0.012);
        const anmeldungGewinn = systemGebuehr8Prozent - abzuege;

        if (!isNaN(anmeldungGewinn)) {
          totalAdminRevenue += anmeldungGewinn;

          const revenueTimestamp = reg.paidAt || event.datum_von || new Date().toISOString();
          try {
            const d = new Date(revenueTimestamp);
            if (!isNaN(d.getTime())) {
              const year = d.getFullYear();
              const month = String(d.getMonth() + 1).padStart(2, '0');
              const day = String(d.getDate()).padStart(2, '0');
              const dateStr = `${year}-${month}-${day}`;
              
              dailyRevenueMap[dateStr] = (dailyRevenueMap[dateStr] || 0) + anmeldungGewinn;

              if (d < aeltestesDatum) {
                aeltestesDatum = new Date(d);
              }
            }
          } catch (err) {}
        }
      });

      return {
        id: event.id,
        name: event.name || "Unbenanntes Event",
        datumVon: event.datum_von || null,
        datumBis: event.datum_bis || null,
        revenue: !isNaN(totalAdminRevenue) ? Math.round(totalAdminRevenue * 100) / 100 : 0
      };
    });

    events.sort((a, b) => {
      const dateA = a.datumVon ? new Date(a.datumVon).getTime() : 0;
      const dateB = b.datumVon ? new Date(b.datumVon).getTime() : 0;
      return dateB - dateA;
    });

    const eventDailyMap: Record<string, number> = {};
    eventsRaw.forEach((e: any) => {
        if (!e.datum_von) return;
        const d = new Date(e.datum_von);
        if (isNaN(d.getTime())) return;
        
        const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        eventDailyMap[dateStr] = (eventDailyMap[dateStr] || 0) + 1;
    });

    // 6. GENERIERUNG DER LÜCKENLOSEN & KUMULIERTEN ZEITACHSEN
    let schleifenTage = 30;
    if (daysParam === "all") {
        const diffTime = Math.abs(heute.getTime() - aeltestesDatum.getTime());
        schleifenTage = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 2; 
    } else {
        schleifenTage = parseInt(daysParam, 10) || 30;
    }

    const timeline: { date: string; zuwachs: number }[] = [];
    const revenueTimeline: { date: string; revenue: number }[] = [];
    const eventTimeline: { date: string; count: number }[] = [];

    let kumulierteSeglerAnzahl = 0;
    let kumulierteEventAnzahl = 0;

    // Jetzt erst die Initial-Zähler für Zeiträume vor dem aktuellen Filter
    if (daysParam !== "all") {
        const startDerSchleife = new Date();
        startDerSchleife.setDate(heute.getDate() - (parseInt(daysParam, 10) - 1));
        
        seglerRaw.forEach((s: any) => {
            const d = new Date(s.createdAt);
            if (d < startDerSchleife) kumulierteSeglerAnzahl++;
        });
        
        // Optional: Hier auch Events vor dem Zeitraum zählen, falls gewünscht
        eventsRaw.forEach((e: any) => {
            if (e.datum_von) {
                const d = new Date(e.datum_von);
                if (d < startDerSchleife) kumulierteEventAnzahl++;
            }
        });
    }

    // Nun die Schleife
    for (let i = schleifenTage - 1; i >= 0; i--) {
    const laufendesDatum = new Date();
    laufendesDatum.setDate(heute.getDate() - i);
    laufendesDatum.setHours(0, 0, 0, 0); // Wichtig für Vergleich
    
    const displayDate = `${String(laufendesDatum.getDate()).padStart(2, '0')}.${String(laufendesDatum.getMonth() + 1).padStart(2, '0')}.`;

    // Zähle Events, die an diesem Tag aktiv sind
    // Ein Event ist aktiv, wenn (datum_von <= laufendesDatum) UND (datum_bis >= laufendesDatum)
    const tagesAktiveEvents = eventsRaw.filter(e => {
        if (!e.datum_von) return false;
        const von = new Date(e.datum_von);
        const bis = e.datum_bis ? new Date(e.datum_bis) : new Date(von); // Fallback falls kein Bis-Datum
        
        return laufendesDatum >= von && laufendesDatum <= bis;
    }).length;

    // Nur für die Timeline (jetzt nicht mehr kumuliert, sondern der Tageswert)
    eventTimeline.push({ date: displayDate, count: tagesAktiveEvents });
        laufendesDatum.setDate(heute.getDate() - i);
        const dateStr = laufendesDatum.toISOString().split('T')[0];

        // User
        kumulierteSeglerAnzahl += (seglerDailyMap[dateStr] || 0);
        timeline.push({ date: displayDate, zuwachs: kumulierteSeglerAnzahl });

        // Umsatz
        revenueTimeline.push({ date: displayDate, revenue: dailyRevenueMap[dateStr] || 0 });

        // Events
        kumulierteEventAnzahl += (eventDailyMap[dateStr] || 0); // Hier passiert das NaN, wenn keine Initialisierung
        eventTimeline.push({ date: displayDate, count: kumulierteEventAnzahl });
    }

    return NextResponse.json({
      success: true,
      stats: { seglerCount, vereineCount, eventsCount },
      vereine,
      events,
      timeline,
      revenueTimeline,
      eventTimeline // HIER MITGEBEN
    }, {
      headers: { 
        "Cache-Control": "no-store, max-age=0, must-revalidate",
        "Pragma": "no-cache"
      }
    });

  } catch (error: any) {
    console.error("[CRITICAL GLOBAL API ERROR]:", error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL ist nicht definiert.");
    const body = await request.json();
    const { vereinId, isApproved } = body;
    if (!vereinId || typeof isApproved !== "boolean") return NextResponse.json({ success: false, message: "Ungültige Parameter." }, { status: 400 });

    const updateResult = await sql`UPDATE "Verein" SET "isApproved" = ${isApproved} WHERE id = ${vereinId} RETURNING id`;
    if (updateResult.length === 0) return NextResponse.json({ success: false, message: "Verein nicht gefunden." }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}