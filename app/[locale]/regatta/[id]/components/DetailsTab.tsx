"use client";

import dynamic from "next/dynamic";
import { useTranslations } from "next-intl";
import type { Account, RegattaEvent } from "../types";

const EventMap = dynamic(() => import("@/components/EventMap"), {
  ssr: false,
  loading: () => <div className="h-full w-full bg-blue-900/20 animate-pulse rounded-2xl" />,
});

export default function DetailsTab({
  event,
  verein,
  hideMap,
}: {
  event: RegattaEvent;
  verein: Account | null;
  // Leaflet ignoriert z-index; solange das Einladungs-Modal offen ist, Karte ausblenden
  hideMap: boolean;
}) {
  const t = useTranslations("regattaDetail");

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-4 bg-blue-800/20 p-6 rounded-2xl border border-white/5">

        {/* Linke Spalte */}
        <div className="space-y-4">
          <p className="flex gap-1.5 items-baseline">
            <span className="text-white/40 text-sm uppercase font-bold tracking-wider whitespace-nowrap">
              {t("details.eventPeriod")}:
            </span>
            <span className="font-semibold text-white">
              {event.datumVon ? new Date(event.datumVon).toLocaleDateString("de-DE") : "—"}
              {" – "}
              {event.datumBis ? new Date(event.datumBis).toLocaleDateString("de-DE") : "—"}
            </span>
          </p>

          <p className="flex gap-1.5 items-baseline">
            <span className="text-white/40 text-sm uppercase font-bold tracking-wider whitespace-nowrap">
              {t("details.registrationPeriod")}:
            </span>
            <span className="font-semibold text-white">
              {event.anmeldungVon ? new Date(event.anmeldungVon).toLocaleDateString("de-DE") : "—"}
              {" – "}
              {event.anmeldungBis ? new Date(event.anmeldungBis).toLocaleDateString("de-DE") : "—"}
            </span>
          </p>

          <p className="flex gap-1.5 items-baseline">
            <span className="text-white/40 text-sm uppercase font-bold tracking-wider whitespace-nowrap">
              {t("details.organizer")}:
            </span>
            <span className="font-semibold text-white">{verein?.name || "—"}</span>
          </p>
        </div>

        {/* Rechte Spalte */}
        <div className="space-y-4">
          <p className="flex gap-1.5 items-baseline">
            <span className="text-white/40 text-sm uppercase font-bold tracking-wider whitespace-nowrap">
              {t("details.email")}:
            </span>
            <span className="font-semibold text-blue-400">{verein?.email || "—"}</span>
          </p>
          <p className="flex gap-1.5 items-baseline">
            <span className="text-white/40 text-sm uppercase font-bold tracking-wider whitespace-nowrap">
              {t("details.address")}:
            </span>
            <span className="font-semibold text-white">{verein?.adresse || event.location}</span>
          </p>
        </div>
      </div>

      {/* NOTIZEN / BESCHREIBUNG */}
      {event.notizen && (
        <div className="bg-white/5 p-6 rounded-2xl border border-white/5 space-y-3">
          <h3 className="text-white/40 text-sm uppercase font-bold tracking-wider flex items-center gap-2">
            <span>📝</span> {t("details.notes")}
          </h3>
          <div className="text-white/80 text-sm leading-relaxed whitespace-pre-wrap">
            {event.notizen}
          </div>
        </div>
      )}

      {/* MAP Bereich */}
      {!hideMap && Number.isFinite(event.latitude) && Number.isFinite(event.longitude) ? (
        <div className="h-80 w-full rounded-2xl overflow-hidden border border-white/10">
          <EventMap
            lat={event.latitude!}
            lng={event.longitude!}
            title={event.name}
          />
        </div>
      ) : (
        <div className="h-80 flex items-center justify-center rounded-2xl border border-white/10 text-white/60">
          {t("details.noCoordinates")}
        </div>
      )}
    </div>
  );
}
