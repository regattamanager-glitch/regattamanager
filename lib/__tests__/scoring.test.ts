import { describe, it, expect } from "vitest";
import {
  discardsForRaces,
  placeToPoints,
  higherIsBetter,
  computeRegattaPlacements,
  parseTimeToSeconds,
  correctedTime,
  timesToRaceScores,
  aggregateChampionship,
  type EventResult,
} from "@/lib/scoring";

describe("discardsForRaces", () => {
  it("liefert 0 Streicher, wenn racesPerDiscard 0 oder negativ ist", () => {
    expect(discardsForRaces(8, 0)).toBe(0);
    expect(discardsForRaces(8, -1)).toBe(0);
  });

  it("skaliert mit der Rennanzahl", () => {
    expect(discardsForRaces(3, 4)).toBe(0);
    expect(discardsForRaces(4, 4)).toBe(1);
    expect(discardsForRaces(7, 4)).toBe(1);
    expect(discardsForRaces(8, 4)).toBe(2);
  });
});

describe("placeToPoints", () => {
  it("low_point: Platz = Punkte", () => {
    expect(placeToPoints(1, 10, "low_point")).toBe(1);
    expect(placeToPoints(7, 10, "low_point")).toBe(7);
  });

  it("high_point: 1. Platz = meiste Punkte, nie negativ", () => {
    expect(placeToPoints(1, 10, "high_point")).toBe(10);
    expect(placeToPoints(10, 10, "high_point")).toBe(1);
    expect(placeToPoints(15, 10, "high_point")).toBe(0);
  });

  it("bonus_point: Tabelle für Plätze 1-7, danach Platz + 6", () => {
    expect(placeToPoints(1, 10, "bonus_point")).toBe(0);
    expect(placeToPoints(2, 10, "bonus_point")).toBe(3);
    expect(placeToPoints(7, 10, "bonus_point")).toBe(13);
    expect(placeToPoints(8, 10, "bonus_point")).toBe(14);
  });
});

describe("higherIsBetter", () => {
  it("nur bei high_point", () => {
    expect(higherIsBetter("high_point")).toBe(true);
    expect(higherIsBetter("low_point")).toBe(false);
    expect(higherIsBetter("bonus_point")).toBe(false);
  });
});

describe("computeRegattaPlacements", () => {
  it("sortiert nach Gesamtpunkten (Low-Point)", () => {
    const placements = computeRegattaPlacements(
      ["a", "b", "c"],
      {
        a: ["1", "2", "1"],
        b: ["2", "1", "2"],
        c: ["3", "3", "3"],
      }
    );
    expect(placements.get("a")).toEqual({ netPoints: 4, placement: 1 });
    expect(placements.get("b")).toEqual({ netPoints: 5, placement: 2 });
    expect(placements.get("c")).toEqual({ netPoints: 9, placement: 3 });
  });

  it("wertet DNF/DNS/DNC als Teilnehmer + 1", () => {
    const placements = computeRegattaPlacements(
      ["a", "b"],
      {
        a: ["1", "DNF"],
        b: ["2", "1"],
      }
    );
    // a: 1 + 3 = 4, b: 2 + 1 = 3 -> b gewinnt
    expect(placements.get("b")!.placement).toBe(1);
    expect(placements.get("a")!.netPoints).toBe(4);
  });

  it("streicht ab 4 Rennen das schlechteste Ergebnis", () => {
    const placements = computeRegattaPlacements(
      ["a"],
      { a: ["1", "5", "2", "1"] },
      4
    );
    // 1+5+2+1 = 9, minus Streicher (5) = 4
    expect(placements.get("a")!.netPoints).toBe(4);
  });

  it("streicht mehrfach bei entsprechend vielen Rennen", () => {
    const placements = computeRegattaPlacements(
      ["a"],
      { a: ["1", "5", "2", "1", "4", "1", "1", "6"] },
      4
    );
    // 8 Rennen / 4 = 2 Streicher: 6 und 5 fallen weg -> 1+2+1+4+1+1 = 10
    expect(placements.get("a")!.netPoints).toBe(10);
  });

  it("Tie-Break: beste Platzierung in der zuletzt gefahrenen Wettfahrt gewinnt", () => {
    const placements = computeRegattaPlacements(
      ["a", "b"],
      {
        a: ["1", "2"], // 3 Punkte, letzte Wettfahrt: 2
        b: ["2", "1"], // 3 Punkte, letzte Wettfahrt: 1
      }
    );
    expect(placements.get("b")!.placement).toBe(1);
    expect(placements.get("a")!.placement).toBe(2);
  });

  it("Teilnehmer ohne Ergebnisse erhalten 0 Punkte, bleiben aber gelistet", () => {
    const placements = computeRegattaPlacements(["a", "b"], { a: ["1"] });
    expect(placements.size).toBe(2);
    expect(placements.get("b")).toBeDefined();
  });
});

describe("parseTimeToSeconds", () => {
  it("parst reine Sekunden", () => {
    expect(parseTimeToSeconds("305")).toBe(305);
    expect(parseTimeToSeconds("305.5")).toBe(305.5);
  });

  it("parst m:ss und h:mm:ss", () => {
    expect(parseTimeToSeconds("5:05")).toBe(305);
    expect(parseTimeToSeconds("1:05:05")).toBe(3905);
  });

  it("liefert null für Nicht-Zeiten", () => {
    expect(parseTimeToSeconds("DNF")).toBeNull();
    expect(parseTimeToSeconds("")).toBeNull();
    expect(parseTimeToSeconds(null)).toBeNull();
    expect(parseTimeToSeconds(undefined)).toBeNull();
    expect(parseTimeToSeconds("1:aa:05")).toBeNull();
  });
});

describe("correctedTime", () => {
  it("time_on_time: Zeit * 100 / YZ", () => {
    expect(correctedTime(1000, 100, "time_on_time")).toBe(1000);
    expect(correctedTime(1000, 125, "time_on_time")).toBe(800);
  });

  it("time_on_distance: Zeit - YZ * Distanz", () => {
    expect(correctedTime(1000, 60, "time_on_distance", 2)).toBe(880);
  });

  it("fällt bei ungültiger YZ auf die gesegelte Zeit zurück", () => {
    expect(correctedTime(1000, 0, "time_on_time")).toBe(1000);
    expect(correctedTime(1000, -5, "time_on_time")).toBe(1000);
  });
});

describe("timesToRaceScores", () => {
  it("rankt Boote je Wettfahrt nach korrigierter Zeit", () => {
    const scores = timesToRaceScores(
      [
        // schnelles Boot mit hoher YZ: 1200 * 100/120 = 1000 korrigiert
        { seglerId: "fast", yz: 120, raw: ["20:00"] },
        // langsames Boot mit YZ 100: 1100 korrigiert
        { seglerId: "slow", yz: 100, raw: ["18:20"] },
      ],
      "time_on_time"
    );
    expect(scores["fast"]).toEqual(["1"]);
    expect(scores["slow"]).toEqual(["2"]);
  });

  it("gibt Nicht-Finishern den letzten Platz", () => {
    const scores = timesToRaceScores(
      [
        { seglerId: "a", yz: 100, raw: ["10:00"] },
        { seglerId: "b", yz: 100, raw: ["DNF"] },
        { seglerId: "c", yz: 100, raw: ["11:00"] },
      ],
      "time_on_time"
    );
    expect(scores["a"]).toEqual(["1"]);
    expect(scores["c"]).toEqual(["2"]);
    expect(scores["b"]).toEqual(["3"]);
  });
});

function makeEvent(id: string, placements: Record<string, number>, count: number): EventResult {
  const map = new Map<string, { netPoints: number; placement: number }>();
  Object.entries(placements).forEach(([sId, place]) =>
    map.set(sId, { netPoints: place, placement: place })
  );
  return { eventId: id, placements: map, participantCount: count };
}

describe("aggregateChampionship", () => {
  const events = [
    makeEvent("e1", { a: 1, b: 2, c: 3 }, 3),
    makeEvent("e2", { a: 2, b: 1, c: 3 }, 3),
    makeEvent("e3", { a: 1, b: 3 }, 2), // c hat nicht teilgenommen -> DNC
  ];

  it("mode sum: addiert alle Regatten, DNC = Teilnehmer + 1", () => {
    const standings = aggregateChampionship(events, "sum", 0);
    const byId = Object.fromEntries(standings.map((s) => [s.seglerId, s]));
    expect(byId["a"].total).toBe(4); // 1 + 2 + 1
    expect(byId["b"].total).toBe(6); // 2 + 1 + 3
    expect(byId["c"].total).toBe(9); // 3 + 3 + DNC(3)
    expect(byId["a"].rank).toBe(1);
    expect(byId["c"].rank).toBe(3);
  });

  it("mode discard: streicht die schlechtesten Ergebnisse", () => {
    const standings = aggregateChampionship(events, "discard", 1);
    const byId = Object.fromEntries(standings.map((s) => [s.seglerId, s]));
    expect(byId["a"].total).toBe(2); // 1 + 1 (2 gestrichen)
    expect(byId["b"].total).toBe(3); // 2 + 1 (3 gestrichen)
  });

  it("mode best: nur das beste Ergebnis zählt", () => {
    const standings = aggregateChampionship(events, "best", 0);
    const byId = Object.fromEntries(standings.map((s) => [s.seglerId, s]));
    expect(byId["a"].total).toBe(1);
    expect(byId["b"].total).toBe(1);
    expect(byId["c"].total).toBe(3);
  });

  it("markiert Nicht-Teilnahme in perEvent als null", () => {
    const standings = aggregateChampionship(events, "sum", 0);
    const c = standings.find((s) => s.seglerId === "c")!;
    expect(c.perEvent).toEqual([3, 3, null]);
  });

  it("high_point: höhere Gesamtsumme gewinnt, DNC = 0 Punkte", () => {
    const standings = aggregateChampionship(events, "sum", 0, "high_point");
    const byId = Object.fromEntries(standings.map((s) => [s.seglerId, s]));
    // a: (3-1+1) + (3-2+1) + (2-1+1) = 3 + 2 + 2 = 7
    expect(byId["a"].total).toBe(7);
    // c: 1 + 1 + 0 (DNC) = 2
    expect(byId["c"].total).toBe(2);
    expect(byId["a"].rank).toBe(1);
  });
});
