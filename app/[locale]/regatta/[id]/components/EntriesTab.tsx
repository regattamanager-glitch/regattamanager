"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { flagUrl } from "../types";
import type { Meldung, RegattaEvent } from "../types";

export default function EntriesTab({
  event,
  meldungen,
  selectedClass,
  onSelectClass,
}: {
  event: RegattaEvent;
  meldungen: Record<string, Meldung[]>;
  selectedClass: string;
  onSelectClass: (klasse: string) => void;
}) {
  const t = useTranslations("regattaDetail");
  const [openId, setOpenId] = useState<string | null>(null);

  const activeClass = selectedClass || event.bootsklassen[0];
  const list = meldungen[activeClass] ?? [];

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">

      {/* Klassenliste */}
      <ul className="space-y-2 border-r border-white/10 pr-4">
        {event.bootsklassen.map((cls, index) => (
          <li
            key={`${cls}-${index}`}
            onClick={() => onSelectClass(cls)}
            className={`cursor-pointer p-2 rounded transition ${
              selectedClass === cls || (!selectedClass && index === 0)
                ? "bg-blue-700"
                : "hover:bg-blue-800/40"
            }`}
          >
            {cls}
          </li>
        ))}
      </ul>

      {/* Seglerliste */}
      <div className="md:col-span-3 bg-blue-800/40 p-6 rounded-xl space-y-4">

        {/* HEADER mit Anzahl Segler */}
        <div className="flex justify-between items-center border-b border-white/20 pb-3">
          <h3 className="text-xl font-semibold">
            {t("entries.header", { klasse: activeClass })}
          </h3>
          <span className="text-white/70">
            {t("entries.sailors", { count: list.length })}
          </span>
        </div>

        {/* LISTE */}
        {!list.length ? (
          <p className="text-white/60">{t("entries.none")}</p>
        ) : (
          <ul className="space-y-2">
            {list.map((m) => {
              const isOpen = openId === m.id;

              return (
                <li key={m.id} className="border border-white/10 rounded-xl overflow-hidden">

                  {/* COLLAPSED BUTTON */}
                  <button
                    onClick={() => setOpenId(isOpen ? null : m.id)}
                    className="w-full flex justify-between items-center px-4 py-3 hover:bg-blue-700/40 transition"
                  >
                    <div className="flex items-center gap-3 text-left">
                      <img
                        src={flagUrl(m.sailCountry)}
                        alt={m.sailCountry || "un"}
                        className="h-4 w-6 rounded-sm"
                      />

                      <div>
                        <div className="font-semibold">
                          {m.sailCountry} {m.sailNumber}
                          {m.bootName && ` – ${m.bootName}`}
                        </div>
                        <div className="text-sm text-white/70">{m.skipperName}</div>
                      </div>
                    </div>

                    <span className="text-white/60">{isOpen ? "▲" : "▼"}</span>
                  </button>

                  {/* EXPANDED */}
                  {isOpen && (
                    <div className="p-5 bg-blue-950/60 border-t border-white/10">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-3 gap-x-8 text-sm text-white/80">

                        <div className="space-y-1">
                          <p className="text-white/40 text-[10px] uppercase font-bold mb-1 tracking-widest">
                            {t("entries.people")}
                          </p>
                          <p><strong>{t("entries.skipper")}</strong> : {m.skipperName}</p>
                          <p>
                            <strong>{t("entries.crew")}</strong> : {m.crew && m.crew !== "" ? m.crew : "Einhand"}
                          </p>
                        </div>

                        {/* Rechte Spalte: Boot & Status */}
                        <div className="space-y-1">
                          <p className="text-white/40 text-[10px] uppercase font-bold mb-1 tracking-widest">{t("entries.boatStatus")}</p>
                          <p><strong>{t("entries.nation")}</strong> : {m.sailCountry || "—"}</p>
                          <p><strong>{t("entries.sailNumber")}</strong> : {m.sailCountry} {m.sailNumber}</p>
                          {m.bootName && <p><strong>{t("entries.boat")}</strong> : {m.bootName}</p>}

                          {/* Bootsklasse nur bei GLOBAL oder alleKlassen anzeigen */}
                          {(selectedClass === "GLOBAL" || event.alleKlassen) && m.bootsklasse && (
                            <p><strong>{t("entries.class")}</strong> : {m.bootsklasse}</p>
                          )}

                          <p className="mt-2 flex items-center gap-2">
                            <strong>{t("entries.status")}</strong> :
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                              m.bezahlt ? "bg-green-500/20 text-green-400 border border-green-500/30" : "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30"
                            }`}>
                              {m.bezahlt ? t("entries.paid") : t("entries.paymentOpen")}
                            </span>
                          </p>
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
