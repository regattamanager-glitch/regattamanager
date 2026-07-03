"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useRouter } from "@/navigation";
import { useTranslations } from "next-intl";

import DetailsTab from "./components/DetailsTab";
import ClassesTab from "./components/ClassesTab";
import EntriesTab from "./components/EntriesTab";
import ResultsTab from "./components/ResultsTab";
import DocumentsTab from "./components/DocumentsTab";
import InviteFriendsModal from "./components/InviteFriendsModal";
import type { Account, Meldung, RegattaEvent, ResultsData, SeglerAnmeldung } from "./types";

export default function RegattaDetailPage() {
  const t = useTranslations("regattaDetail");
  const tCommon = useTranslations("Common");
  const router = useRouter();

  const params = useParams<{ id: string; locale: string }>();
  const id = params.id;

  const [seglerId, setSeglerId] = useState<string | null>(null);

  // Eingeloggten Segler aus der Server-Session ermitteln (nicht aus localStorage,
  // damit die Anzeige nie von einem veralteten lokalen Wert abhängt).
  useEffect(() => {
    let cancelled = false;
    fetch("/api/accounts/session")
      .then((res) => (res.ok ? res.json() : null))
      .then((session) => {
        if (!cancelled && session?.type === "segler" && session?.id) {
          setSeglerId(String(session.id));
        }
      })
      .catch(() => {
        // Nicht eingeloggt/offline: Segler-Funktionen bleiben ausgeblendet
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const [event, setEvent] = useState<RegattaEvent | null>(null);
  const [verein, setVerein] = useState<Account | null>(null);
  const [activeTab, setActiveTab] = useState("details");
  const [selectedClass, setSelectedClass] = useState<string>("");
  const [meldungen, setMeldungen] = useState<Record<string, Meldung[]>>({});
  const [resultsData, setResultsData] = useState<ResultsData>({});
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const [eventsRes, registrationsRes] = await Promise.all([
          fetch("/api/events"),
          fetch(`/api/registrations?eventid=${id}`),
        ]);

        const events: RegattaEvent[] = await eventsRes.json();
        const allRegs = await registrationsRes.json();
        const found = events.find((e) => e.id === id);

        if (!found) return;

        const vId = (found as any).verein_id;

        if (vId) {
          const vereinRes = await fetch(`/api/accounts?id=${vId}`);
          if (vereinRes.ok) {
            const vereinData = await vereinRes.json();
            setVerein(vereinData.data || vereinData);
          } else {
            // Öffentlich (nicht eingeloggt): nur der Vereinsname aus der Events-API.
            // Kontaktdaten (E-Mail/Adresse) sind bewusst login-geschützt.
            setVerein({ name: (found as any).vereinName || "—" } as any);
          }
        }

        // Gruppiere die Segler
        const groupedSegler: Record<string, SeglerAnmeldung[]> = {};
        if (Array.isArray(allRegs)) {
          allRegs.forEach((reg: any) => {
            const klasse = reg.klasse || "Unknown";
            if (!groupedSegler[klasse]) groupedSegler[klasse] = [];

            groupedSegler[klasse].push({
              skipper: typeof reg.skipper === "string" ? JSON.parse(reg.skipper) : reg.skipper,
              boot: typeof reg.boot === "string" ? JSON.parse(reg.boot) : reg.boot,
              bezahlt: !!reg.paidAt,
              createdAt: reg.createdAt,
            });
          });
        }

        setEvent({
          ...found,
          vereinId: vId,
          segler: groupedSegler,
          notizen: found.notizen || "",
          anmeldungVon: found.anmeldungsZeitraum?.von || found.anmeldungVon,
          anmeldungBis: found.anmeldungsZeitraum?.bis || found.anmeldungBis,
          gebuehren_pro_klasse: found.gebuehren_pro_klasse || {},
        });

        if (found.bootsklassen?.length > 0) {
          setSelectedClass(found.bootsklassen[0]);
        }
      } catch (err) {
        console.error("Fehler beim Laden:", err);
      }
    }
    load();
  }, [id]);

  function goToRegister(klasse: string) {
    if (!seglerId) {
      router.push("/login");
      return;
    }

    router.push(
      `/dashboard/segler/${seglerId}/registertoevent?eventId=${event!.id}&klasse=${klasse}`
    );
  }

  // Meldungen laden, sobald der Tab aktiv ist
  useEffect(() => {
    if (activeTab !== "meldungen" || !event?.id) return;

    const currentClass: string = event.alleKlassen
      ? "GLOBAL"
      : (selectedClass || event.bootsklassen?.[0] || "Unknown");

    const eventId = event.id;

    async function loadMeldungen() {
      if (!currentClass || meldungen[currentClass]) return;

      try {
        const response = await fetch(`/api/registrations?eventid=${eventId}`);
        const data = await response.json();

        const allRegistrations = Array.isArray(data) ? data : (data.registrations || []);

        const filteredList = allRegistrations.filter((reg: any) => {
          if (currentClass === "GLOBAL" || event?.alleKlassen) return true;
          return reg.klasse === currentClass;
        });

        const mapped = filteredList.map((entry: any) => {
          const safeParse = (data: any) => {
            if (!data) return [];
            if (typeof data === "string") {
              try { return JSON.parse(data); } catch { return []; }
            }
            return data;
          };

          const skipperData = safeParse(entry.skipper);
          const bootData = safeParse(entry.boot);

          const rawCrew = entry.crew || skipperData.crew || [];

          // Nur die Namen der Crew-Mitglieder: "Pablo Sanz, Luis Navarro"
          const crewNames = Array.isArray(rawCrew)
            ? rawCrew.map((person: any) => person.name).filter(Boolean).join(", ")
            : "";

          return {
            id: entry.id,
            skipperName: skipperData.name || "Unbekannt",
            skipperCountry: skipperData.nation || "??",
            sailCountry: bootData.countryCode || "??",
            sailNumber: bootData.segelnummer || "0",
            bootName: bootData.bootName || "",
            crew: crewNames,
            bezahlt: !!entry.paidAt,
            bootsklasse: entry.klasse || currentClass,
          };
        });

        setMeldungen((prev) => ({
          ...prev,
          [currentClass]: mapped,
        }));
      } catch (err) {
        console.error("Fehler beim Laden der Segler:", err);
      }
    }

    loadMeldungen();

    // Nur setSelectedClass aufrufen, wenn sich der Wert tatsächlich ändert,
    // um unnötige Re-Renders zu vermeiden.
    if (selectedClass !== currentClass) {
      setSelectedClass(currentClass);
    }
  }, [activeTab, event, selectedClass, event?.id]);

  // Ergebnisse laden, sobald der Tab aktiv ist
  useEffect(() => {
    if (activeTab !== "ergebnisse" || !event) return;

    async function loadResults() {
      const klasseToLoad = selectedClass || event?.bootsklassen[0];
      if (!klasseToLoad) return;

      try {
        if (!event) return;
        const res = await fetch(`/api/events/results?eventId=${event.id}&klasse=${encodeURIComponent(klasseToLoad)}`);
        const data = await res.json();

        if (data.success && data.results) {
          setResultsData((prev) => ({
            ...prev,
            [event.id]: {
              ...(prev[event.id] ?? {}),
              [klasseToLoad]: data.results,
            },
          }));
        }
      } catch (err) {
        console.error("Fehler beim Laden der Ergebnisse:", err);
      }
    }

    loadResults();
  }, [activeTab, event, selectedClass]);

  if (!event) {
    return <div className="min-h-screen flex items-center justify-center text-white">{t("loading")}</div>;
  }

  return (
    <main className="min-h-screen px-6 py-12 rounded-3xl bg-blue-950/50 backdrop-blur-md">
      <div className="max-w-7xl mx-auto space-y-10">

        {/* HEADER */}
        <section className="bg-blue-900/50 p-10 rounded-3xl border border-white/10 flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-bold text-white">{event.name}</h1>
            <p className="text-white/80 mt-2">
              {event.datumVon} – {event.datumBis} · {event.location}
            </p>
            <p className="text-white/60 mt-1">
              {t("details.organizer")}: {verein?.name || t("fallback")}
            </p>
          </div>

          {/* Dashboard / Back Buttons */}
          <div className="flex gap-3">
            {seglerId ? (
              <>
                <button
                  onClick={() => setIsInviteModalOpen(true)}
                  className="bg-indigo-600/80 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl transition flex items-center gap-2 border border-indigo-500/30"
                >
                  <span>👋</span> {t("inviteFriends")}
                </button>
                <button
                  onClick={() => router.back()}
                  className="bg-blue-600/50 text-white px-4 py-2 rounded hover:bg-blue-800/90 transition font-medium"
                >
                  {tCommon("back")}
                </button>
              </>
            ) : (
              <button
                onClick={() => router.back()}
                className="bg-slate-700/50 text-white px-6 py-2 rounded-xl hover:bg-slate-600 transition font-medium border border-white/10"
              >
                ← {tCommon("back")}
              </button>
            )}
          </div>

          {isInviteModalOpen && seglerId && (
            <InviteFriendsModal
              seglerId={seglerId}
              eventId={event.id}
              eventName={event.name}
              onClose={() => setIsInviteModalOpen(false)}
            />
          )}
        </section>

        {/* TABS */}
        <div className="flex gap-4 border-b border-white/20">
          {["details", "bootsklassen", "meldungen", "ergebnisse", "dokumente"].map((tab) => (
            <button
              key={tab}
              onClick={() => {
                setActiveTab(tab);
                setSelectedClass(event.bootsklassen[0]);
              }}
              className={`px-6 py-2 rounded-t-xl font-semibold ${
                activeTab === tab
                  ? "bg-blue-700 text-white"
                  : "bg-blue-900/40 text-white/60"
              }`}
            >
              {t(`tabs.${tab}`)}
            </button>
          ))}
        </div>

        {/* CONTENT */}
        <section className="bg-blue-900/50 rounded-3xl p-8 border border-white/10 text-white">
          {activeTab === "details" && (
            <DetailsTab event={event} verein={verein} hideMap={isInviteModalOpen} />
          )}

          {activeTab === "bootsklassen" && (
            <ClassesTab event={event} onRegister={goToRegister} />
          )}

          {activeTab === "meldungen" && (
            <EntriesTab
              event={event}
              meldungen={meldungen}
              selectedClass={selectedClass}
              onSelectClass={setSelectedClass}
            />
          )}

          {activeTab === "ergebnisse" && (
            <ResultsTab
              event={event}
              resultsData={resultsData}
              selectedClass={selectedClass}
              onSelectClass={setSelectedClass}
            />
          )}

          {activeTab === "dokumente" && (
            <DocumentsTab documents={event.documents} />
          )}
        </section>
      </div>
    </main>
  );
}
