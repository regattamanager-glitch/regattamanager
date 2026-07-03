"use client";

import { useTranslations } from "next-intl";
import type { RegattaEvent } from "../types";

export default function ClassesTab({
  event,
  onRegister,
}: {
  event: RegattaEvent;
  onRegister: (klasse: string) => void;
}) {
  const t = useTranslations("regattaDetail");

  if (event.alleKlassen) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between bg-blue-800/40 p-6 rounded-2xl border border-white/5 items-center">
          <span>{t("classes.openForAll")}</span>
          <button
            onClick={() => onRegister("GLOBAL")}
            className="bg-blue-600 hover:bg-blue-500 px-6 py-3 rounded-xl font-medium transition shadow-lg"
          >
            {t("classes.registerNow")}
          </button>
        </div>
      </div>
    );
  }

  if (!event.gebuehren_pro_klasse) {
    return (
      <p className="text-center text-gray-400 p-8">
        {t("classes.noClassesAvailable")}
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {Object.entries(event.gebuehren_pro_klasse).map(([className, config], index) => {
        const data = config as any;

        // Datum Logik: Prüfe auf spezifischen Zeitraum der Klasse, sonst Regatta-Zeitraum
        const datumVon = data.datumVon || event.datumVon;
        const datumBis = data.datumBis || event.datumBis;

        const displayDate = `${new Date(datumVon).toLocaleDateString("de-DE")} – ${new Date(datumBis).toLocaleDateString("de-DE")}`;

        // Aktuelles Datum für den Vergleich (auf 00:00:00 gesetzt für korrekte Tages-Vergleiche)
        const now = new Date();
        now.setHours(0, 0, 0, 0);

        const anmeldungVon = new Date(event.anmeldungsZeitraum.von);
        const anmeldungBis = new Date(event.anmeldungsZeitraum.bis);
        const isRegistrationOpen = now >= anmeldungVon && now <= anmeldungBis;

        return (
          <div
            key={`${className}-${index}`}
            className="bg-blue-800/40 p-5 rounded-2xl border border-blue-700/50 flex flex-col md:flex-row md:items-center justify-between gap-4"
          >
            <div className="flex flex-col gap-2">
              <span className="font-bold text-xl text-white tracking-tight">{className}</span>

              <div className="flex flex-wrap gap-2 text-sm text-gray-300">
                <span className="bg-blue-950/50 px-3 py-1 rounded-full border border-blue-800 flex items-center gap-2">
                  📅 <span className="text-white font-semibold">{displayDate}</span>
                </span>

                {data.gender && (
                  <span className="bg-indigo-900/30 px-3 py-1 rounded-full text-indigo-200 border border-indigo-800/50">
                    {data.gender}
                  </span>
                )}
                {(data.minAge || data.maxAge) && (
                  <span className="bg-emerald-900/30 px-3 py-1 rounded-full text-emerald-200 border border-emerald-800/50">
                    Alter: {data.minAge ?? "0"} - {data.maxAge ?? "∞"}
                  </span>
                )}
              </div>
            </div>

            {isRegistrationOpen ? (
              <button
                onClick={() => onRegister(className)}
                className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-xl font-medium transition-all shadow-lg flex-shrink-0"
              >
                {t("classes.register")}
              </button>
            ) : (
              <span className="text-gray-500 text-sm italic px-4">
                {now > anmeldungBis
                  ? t("classes.registrationClosed")
                  : t("classes.registrationNotYetOpen")}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}
