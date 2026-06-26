/**
 * Server-seitige Wertungs-Logik.
 *
 * Teil A: Platzierung innerhalb EINER Regatta (Low-Point + Streicher + Tie-Break
 *         über die zuletzt gefahrene Wettfahrt) – identisch zur Frontend-Logik.
 * Teil B: Aggregation einer Meisterschaft über MEHRERE Regatten (3 Modi).
 */

export type ScoringMode = "sum" | "discard" | "best";
export type ScoringSystem = "low_point" | "high_point" | "bonus_point";

export interface RegattaPlacement {
  netPoints: number;
  placement: number;
}

/** Wie viele Streicher bei n Wettfahrten greifen (skaliert mit der Rennanzahl). */
export function discardsForRaces(races: number, racesPerDiscard: number): number {
  if (!racesPerDiscard || racesPerDiscard <= 0) return 0;
  return Math.floor(races / racesPerDiscard);
}

/** Wandelt einen Platz in Punkte um – je nach Wertungssystem. */
export function placeToPoints(place: number, fleetSize: number, system: ScoringSystem): number {
  if (system === "high_point") {
    return Math.max(0, fleetSize - place + 1); // 1. = meiste Punkte
  }
  if (system === "bonus_point") {
    const table: Record<number, number> = { 1: 0, 2: 3, 3: 5.7, 4: 8, 5: 10, 6: 11.7, 7: 13 };
    return table[place] ?? place + 6;
  }
  return place; // low_point: Platz = Punkte
}

/** Bei diesem System gewinnt der höhere Gesamtwert? */
export function higherIsBetter(system: ScoringSystem): boolean {
  return system === "high_point";
}

/**
 * Platzierungen für eine Regatta + Klasse (regatta-intern immer Low-Point).
 * Streicher skalieren mit der tatsächlichen Rennanzahl dieser Klasse.
 * @param participantIds Liste der gemeldeten Segler-IDs dieser Klasse
 * @param results        { seglerId: ["1","3","DNF", ...] } Wettfahrt-Ergebnisse
 * @param racesPerDiscard ab wie vielen Rennen je ein Streicher greift (0 = keine)
 */
export function computeRegattaPlacements(
  participantIds: string[],
  results: Record<string, string[]>,
  racesPerDiscard = 4
): Map<string, RegattaPlacement> {
  const n = participantIds.length;

  const scored = participantIds.map((sId) => {
    const raw = results[sId] || [];
    const numeric = raw.map((s) => {
      const v = parseFloat(String(s));
      return !isNaN(v) ? v : n + 1; // DNF/DNS/DNC etc. -> Teilnehmer + 1
    });

    // Streicher: die schlechtesten (höchsten) Ergebnisse streichen, Anzahl
    // skaliert mit der Rennanzahl dieser Klasse.
    const discards = discardsForRaces(numeric.length, racesPerDiscard);
    const dropSum = [...numeric]
      .sort((a, b) => b - a)
      .slice(0, discards)
      .reduce((sum, v) => sum + v, 0);
    const total = numeric.reduce((sum, v) => sum + v, 0) - dropSum;

    return { sId, total, raceScores: numeric };
  });

  const maxRaces = Math.max(0, ...scored.map((s) => s.raceScores.length));

  scored.sort((a, b) => {
    if (a.total !== b.total) return a.total - b.total;
    // Tie-Break: beste Platzierung in der zuletzt gefahrenen Wettfahrt zuerst.
    for (let idx = maxRaces - 1; idx >= 0; idx--) {
      const sa = a.raceScores[idx] ?? Infinity;
      const sb = b.raceScores[idx] ?? Infinity;
      if (sa !== sb) return sa - sb;
    }
    return 0;
  });

  const map = new Map<string, RegattaPlacement>();
  scored.forEach((s, i) => map.set(s.sId, { netPoints: s.total, placement: i + 1 }));
  return map;
}

/* ------------------------------------------------------------------------- */
/* Yardstick: Zeit -> korrigierte Zeit -> Platz je Wettfahrt                  */
/* ------------------------------------------------------------------------- */

export type YardstickMethod = "time_on_time" | "time_on_distance";

/**
 * Wandelt eine Zeit-Eingabe in Sekunden um.
 * Akzeptiert "Sekunden" ("305"), "m:ss" ("5:05") oder "h:mm:ss" ("1:05:05").
 * Nicht-Zeiten (DNF/DNS/...) -> null.
 */
export function parseTimeToSeconds(value: string | undefined | null): number | null {
  if (value == null) return null;
  const s = String(value).trim();
  if (s === "") return null;
  if (/^\d+(\.\d+)?$/.test(s)) return parseFloat(s); // reine Sekunden
  const parts = s.split(":").map((p) => p.trim());
  if (parts.some((p) => p === "" || isNaN(Number(p)))) return null;
  const nums = parts.map(Number);
  if (nums.length === 2) return nums[0] * 60 + nums[1];
  if (nums.length === 3) return nums[0] * 3600 + nums[1] * 60 + nums[2];
  return null;
}

/** Korrigierte Zeit nach gewählter Methode. */
export function correctedTime(
  elapsedSeconds: number,
  yz: number,
  method: YardstickMethod,
  distance = 1
): number {
  if (!yz || yz <= 0) return elapsedSeconds;
  if (method === "time_on_distance") return elapsedSeconds - yz * distance;
  return (elapsedSeconds * 100) / yz; // time_on_time (Standard)
}

export interface YardstickEntry {
  seglerId: string;
  yz: number;
  /** Roh-Eingaben je Wettfahrt (Zeiten oder Codes wie "DNF"). */
  raw: (string | undefined)[];
}

/**
 * Erzeugt aus Zeit-Eingaben die Platz-Wertung je Wettfahrt (1,2,3 …) anhand der
 * korrigierten Zeiten. Das Ergebnis kann anschließend wie normale Platz-Scores
 * an computeRegattaPlacements übergeben werden (gemischte Flotte = alle Boote
 * der Gruppe gemeinsam, jedes mit eigener YZ).
 *
 * Nicht-Zeiten (leer/DNF) erhalten den schlechtesten Platz (n) dieser Wettfahrt.
 */
export function timesToRaceScores(
  entries: YardstickEntry[],
  method: YardstickMethod,
  distancePerRace: number[] = []
): Record<string, string[]> {
  const n = entries.length;
  const maxRaces = Math.max(0, ...entries.map((e) => e.raw.length));
  const scores: Record<string, string[]> = {};
  entries.forEach((e) => (scores[e.seglerId] = []));

  for (let race = 0; race < maxRaces; race++) {
    const dist = distancePerRace[race] ?? 1;
    const ranked = entries
      .map((e) => {
        const secs = parseTimeToSeconds(e.raw[race]);
        const corrected = secs == null ? Infinity : correctedTime(secs, e.yz, method, dist);
        return { seglerId: e.seglerId, corrected, finished: secs != null };
      })
      .sort((a, b) => a.corrected - b.corrected);

    ranked.forEach((r, idx) => {
      // Gefinishte Boote nach korrigierter Zeit; nicht gefinishte = n (DNF-Platz)
      scores[r.seglerId].push(r.finished ? String(idx + 1) : String(n));
    });
  }

  return scores;
}

export interface EventResult {
  eventId: string;
  placements: Map<string, RegattaPlacement>;
  participantCount: number;
}

export interface ChampionshipStanding {
  seglerId: string;
  perEvent: (number | null)[]; // Platz je Regatta (null = nicht teilgenommen, zählt als DNC)
  total: number;
  rank: number;
}

/**
 * Aggregiert die Platzierungen mehrerer Regatten zu einer Meisterschafts-Wertung.
 * Nicht-Teilnahme an einer Regatta zählt als DNC.
 * Das Wertungssystem (low/high/bonus) bestimmt, wie Plätze in Punkte umgerechnet
 * werden und ob ein hoher oder niedriger Gesamtwert besser ist.
 */
export function aggregateChampionship(
  events: EventResult[],
  mode: ScoringMode,
  discardCount: number,
  system: ScoringSystem = "low_point"
): ChampionshipStanding[] {
  const allIds = new Set<string>();
  events.forEach((e) => e.placements.forEach((_v, id) => allIds.add(id)));
  const highBetter = higherIsBetter(system);

  const rows = [...allIds].map((id) => {
    const perEvent: (number | null)[] = [];
    const points: number[] = [];

    events.forEach((e) => {
      const p = e.placements.get(id);
      if (p) {
        perEvent.push(p.placement);
        points.push(placeToPoints(p.placement, e.participantCount, system));
      } else {
        perEvent.push(null);
        // DNC: schlechtester Wert für das jeweilige System
        const dncPlace = e.participantCount + 1;
        points.push(
          highBetter ? 0 : placeToPoints(dncPlace, e.participantCount, system)
        );
      }
    });

    // "Bestes" zuerst sortieren (System-abhängig), damit Streicher/Best korrekt sind.
    const ordered = [...points].sort((a, b) => (highBetter ? b - a : a - b));

    let total: number;
    if (mode === "best") {
      total = ordered.length ? ordered[0] : 0;
    } else if (mode === "discard") {
      // Die schlechtesten discardCount Resultate streichen.
      const keep = ordered.slice(0, Math.max(0, ordered.length - discardCount));
      total = keep.reduce((a, b) => a + b, 0);
    } else {
      total = points.reduce((a, b) => a + b, 0);
    }

    return { seglerId: id, perEvent, total };
  });

  // Rangfolge je nach System
  rows.sort((a, b) => (highBetter ? b.total - a.total : a.total - b.total));
  return rows.map((r, i) => ({ ...r, rank: i + 1 }));
}
