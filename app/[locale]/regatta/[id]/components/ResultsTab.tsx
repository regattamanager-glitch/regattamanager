"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { flagUrl } from "../types";
import type { RegattaEvent, ResultsData } from "../types";

export default function ResultsTab({
  event,
  resultsData,
  selectedClass,
  onSelectClass,
}: {
  event: RegattaEvent;
  resultsData: ResultsData;
  selectedClass: string;
  onSelectClass: (klasse: string) => void;
}) {
  const t = useTranslations("regattaDetail");
  const [openId, setOpenId] = useState<string | null>(null);

  const activeClass = selectedClass || event.bootsklassen[0];
  const isGlobal = activeClass === "GLOBAL" || event.alleKlassen;

  // Segler-Liste bestimmen
  const seglerList = isGlobal
    ? Object.values(event.segler ?? {}).flat()
    : event.segler?.[activeClass] ?? [];

  const eventResults = resultsData[event.id]?.[activeClass] || {};

  // Berechnung & Sortierung
  const scoredSegler = seglerList.map((s) => {
    const sId = s.skipper.seglerId;
    const scoresRaw = eventResults[sId] || [];

    const numericScores = scoresRaw.map((val) => {
      const n = parseFloat(val);
      return !isNaN(n) ? n : (seglerList.length + 1);
    });

    // Streichergebnis ab 4 Wettfahrten
    let discardIdx = -1;
    if (numericScores.length >= 4) {
      discardIdx = numericScores.indexOf(Math.max(...numericScores));
    }

    const total = numericScores.reduce((sum, val, i) => (i === discardIdx ? sum : sum + val), 0);
    return { s, scoresRaw, total, discardIdx };
  }).sort((a, b) => a.total - b.total);

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
      {/* Klassenliste links */}
      <ul className="space-y-2 border-r border-white/10 pr-4">
        {(event.alleKlassen ? ["GLOBAL", ...event.bootsklassen] : event.bootsklassen).map((cls) => (
          <li
            key={cls}
            onClick={() => onSelectClass(cls)}
            className={`cursor-pointer p-2 rounded transition ${
              (selectedClass === cls || (!selectedClass && event.bootsklassen[0] === cls))
                ? "bg-blue-700 text-white" : "hover:bg-blue-800/40 text-white/60"
            }`}
          >
            {cls}
          </li>
        ))}
      </ul>

      {/* Ergebnisliste rechts */}
      <div className="md:col-span-3 bg-blue-800/40 p-6 rounded-xl space-y-4 text-white">
        {seglerList.length === 0 ? (
          <p className="text-white/60 text-center py-10">{t("results.none")}</p>
        ) : (
          <ul className="space-y-3">
            {scoredSegler.map(({ s, scoresRaw, total, discardIdx }, idx) => {
              const isOpen = openId === s.skipper.seglerId;
              const place = idx + 1;

              // Medaillen-Logik
              const medal = place === 1 ? "🥇" : place === 2 ? "🥈" : place === 3 ? "🥉" : null;

              return (
                <li key={s.skipper.seglerId} className="border border-white/10 rounded-xl bg-blue-900/20 overflow-hidden">
                  <button
                    onClick={() => setOpenId(isOpen ? null : s.skipper.seglerId)}
                    className="w-full flex justify-between items-center px-4 py-4 hover:bg-white/5 transition"
                  >
                    <div className="flex items-center gap-4 text-left">
                      {/* Platzierung oder Medaille */}
                      <span className="font-bold w-8 text-center text-lg">
                        {medal || `${place}.`}
                      </span>
                      <img
                        src={flagUrl(s.boot.countryCode)}
                        alt={s.boot.countryCode || "un"}
                        className="h-4 w-6 rounded-sm shadow-sm"
                      />
                      <div>
                        <div className="font-semibold text-white leading-tight">{s.skipper.name}</div>
                        <div className="text-xs text-white/50">
                          {s.boot.countryCode} {s.boot.segelnummer} {s.boot.bootName && `| ${s.boot.bootName}`}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className="text-sm font-bold text-blue-300 font-mono">
                          {scoresRaw.length > 0
                            ? t("results.points", { points: total })
                            : "—"}
                        </div>
                      </div>
                      <span className="text-white/30 text-xs">{isOpen ? "▲" : "▼"}</span>
                    </div>
                  </button>

                  {isOpen && (
                    <div className="p-5 bg-blue-950/60 border-t border-white/10">
                      {/* Detail-Gitter */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-2 gap-x-8 text-sm text-white/80 mb-6">
                        <p><strong>{t("results.skipper")}:</strong> {s.skipper.name}</p>
                        <p><strong>{t("results.nation")}:</strong> {s.boot.countryCode || "—"}</p>
                        <p><strong>{t("results.sailNumber")}:</strong> {s.boot.countryCode} {s.boot.segelnummer}</p>
                        {s.boot.bootName && <p><strong>{t("results.boat")}:</strong> {s.boot.bootName}</p>}
                        {isGlobal && <p><strong>{t("results.class")}:</strong> {s.boot.bootsklasse || activeClass}</p>}
                      </div>

                      {/* Renn-Einzelergebnisse */}
                      <div className="space-y-2">
                        <p className="text-[10px] uppercase font-bold text-white/40 tracking-widest">{t("results.races")}</p>
                        <div className="flex flex-wrap gap-2">
                          {scoresRaw.map((sc, i) => (
                            <div key={i} className="flex flex-col items-center">
                              <div className={`w-10 h-10 flex items-center justify-center rounded-lg border text-sm font-bold
                                ${i === discardIdx
                                  ? "border-red-500/40 bg-red-500/10 text-red-400 line-through"
                                  : "border-white/10 bg-white/5 text-white"}`}>
                                {sc}
                              </div>
                              <span className="text-[9px] mt-1 opacity-30">R{i + 1}</span>
                            </div>
                          ))}
                          {scoresRaw.length === 0 && (
                            <span className="text-white/30 italic text-xs">{t("results.noResults")}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
