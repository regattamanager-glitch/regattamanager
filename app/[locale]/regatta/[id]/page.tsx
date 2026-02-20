"use client";

import { useSearchParams, useParams } from "next/navigation";
import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { Link, useRouter } from "@/navigation";
import { useTranslations } from "next-intl";

const EventMap = dynamic(() => import("@/components/EventMap"), { 
  ssr: false,
  loading: () => <div className="h-full w-full bg-blue-900/20 animate-pulse rounded-2xl" />
});


type Extra = { name: string; price: number };
type Document = { id: string; name: string; url: string };
type Account = { id: string; name: string; email: string; adresse?: string };

type Event = {
  id: string;
  name: string;
  datumVon: string;
  datumBis: string;
  land: string;
  location: string;
  vereinId: string;
  alleKlassen: boolean;
  bootsklassen: string[];
  gebuehrNormal: number;
  gebuehrSpaet: number;
  extras: Extra[];
  documents: Document[];
  anmeldungVon: string;
  anmeldungBis: string; 
  latitude?: number;
  longitude?: number;

  segler?: Record<string, SeglerAnmeldung[]>; // ← WICHTIG
};


type Meldung = {
  id: string;

  skipperName: string;
  skipperCountry: string;

  sailCountry: string;
  sailNumber: string | number;

  bootName?: string;

  bezahlt?: boolean;

  bootsklasse?: string;
};

type Person = {
  seglerId: string;
  name: string;
  countryCode: string;
};

type BootInfo = {
  bootName?: string;
  segelnummer: string | number;
  countryCode: string;
  bootsklasse?: string;
};

type SeglerAnmeldung = {
  skipper: Person;
  boot: BootInfo;
  bezahlt?: boolean;
  createdAt: string;
};

type ResultsData = Record<
  string, // eventId
  Record<
    string, // bootsklasse
    Record<
      string, // seglerId
      string[] // Ergebnisse pro Rennen
    >
  >
>;

type Friend = {
  id: string;
  name?: string;
};


export default function RegattaDetailPage() {
  const t = useTranslations("regattaDetail");
  const { id } = useParams<{ id: string }>();
  const [openId, setOpenId] = useState<string | null>(null);
  const [event, setEvent] = useState<Event | null>(null);
  const [verein, setVerein] = useState<Account | null>(null);
  const [activeTab, setActiveTab] = useState("details");
  const [selectedClass, setSelectedClass] = useState<string>("");
  const [meldungen, setMeldungen] = useState<Record<string, Meldung[]>>({});
  const router = useRouter();
  const searchParams = useSearchParams();
  const seglerId = searchParams.get("seglerId");
  const [resultsData, setResultsData] = useState<ResultsData>({});
  const [selectedDoc, setSelectedDoc] = useState<string | null>(null);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [userFriends, setUserFriends] = useState<Friend[]>([]);
  const [selectedFriends, setSelectedFriends] = useState<string[]>([]);
  const [isSending, setIsSending] = useState(false);

const sailCountryToFlag: Record<string, string> = {
  ABD: "um", // ggf. wenn Sonderfälle im Backend auftauchen

  // World Sailing Sail Codes → ISO 3166‑1 Alpha‑2
  ALG: "dz",ASA: "as",AND: "ad",ANG: "ao",ANT: "ag",
  ARG: "ar",ARM: "am",ARU: "aw",AUS: "au",AUT: "at",
  AZE: "az",BAH: "bs",BRN: "bh",BAR: "bb",BLR: "by",
  BEL: "be",BIZ: "bz",BER: "bm",BHR: "bh",VIN: "vc",
  BOL: "bo",BOT: "bw",BRA: "br",BRB: "bb",BUL: "bg",
  CAN: "ca",CAY: "ky",CHI: "cl",CHN: "cn",COL: "co",
  COK: "ck",CRO: "hr",CUB: "cu",CYP: "cy",CZE: "cz",
  DEN: "dk",DJI: "dj",DOM: "do",ECU: "ec",EGY: "eg",
  ESA: "sv",EST: "ee",FIJ: "fj",FIN: "fi",FRA: "fr",
  GEO: "ge",GER: "de",GBR: "gb",GRE: "gr",GRN: "gd",
  GUM: "gu",GUA: "gt",HKG: "hk",HUN: "hu",ISL: "is",
  IND: "in",INA: "id",IRL: "ie",ISR: "il",ITA: "it",
  JAM: "jm",JPN: "jp",KAZ: "kz",KEN: "ke",KOR: "kr",
  PRK: "kp",KOS: "xk",KUW: "kw",KGZ: "kg",LAT: "lv",
  LIB: "lb",LBA: "ly",LIE: "li",LTU: "lt",LUX: "lu",
  MAD: "mg",MAS: "my",MLT: "mt",MRI: "mu",MEX: "mx",
  MDA: "md",MON: "mc",MNE: "me",MOZ: "mz",MYA: "mm",
  NAM: "na",NCA: "ni",NED: "nl",NGR: "ng",NOR: "no",
  OMA: "om",PAN: "pa",PER: "pe",PHI: "ph",POL: "pl",
  POR: "pt",QAT: "qa",RSA: "za",SRI: "lk",SKN: "kn",
  SUD: "sd",SWE: "se",SUI: "ch",TAN: "tz",TAH: "pm",
  TJK: "tj",TKA: "to",TUN: "tn",TUR: "tr",TCA: "tc",
  UAE: "ae",UKR: "ua",URU: "uy",USA: "us",USV: "vi",
  VEN: "ve",VIE: "vn",ZIM: "zw"
};

function getSortedResults(seglerList: SeglerAnmeldung[], eventResults: Record<string, string[]>) {
  const numParticipants = seglerList.length;

  const scoredSegler = seglerList.map(entry => {
    const scoresRaw = eventResults[entry.skipper.seglerId] ?? [];
    
    // Umwandlung in numerische Werte für Berechnung & Tie-Break
    const numericScores = scoresRaw.map(s => {
      const n = parseFloat(s);
      if (!isNaN(n)) return n;
      // World Sailing: DNC = Teilnehmer + 1, Andere (DNF, DNS, etc.) = Starter + 1
      // Vereinfacht für dieses System:
      if (s === "DNC") return numParticipants + 1;
      return numParticipants + 1; 
    });

    // Streichergebnis berechnen (ab 4 Rennen)
    let discardIndex = -1;
    if (numericScores.length >= 4) {
      const maxVal = Math.max(...numericScores);
      discardIndex = numericScores.indexOf(maxVal);
    }

    const totalPoints = numericScores.reduce((sum, val, idx) => 
      idx === discardIndex ? sum : sum + val, 0
    );

    // Hilfswert für Tie-Break: Sortierte Liste der Netto-Ergebnisse (beste zuerst)
    const tieBreakScores = numericScores
      .filter((_, idx) => idx !== discardIndex)
      .sort((a, b) => a - b);

    return { entry, scoresRaw, totalPoints, discardIndex, tieBreakScores };
  });

  // Sortierung: 1. Punkte (weniger ist besser), 2. Tie-Break (bessere Einzelplatzierungen)
  return scoredSegler.sort((a, b) => {
    if (a.totalPoints !== b.totalPoints) {
      return a.totalPoints - b.totalPoints;
    }
    // Tie-Break Logik (A8.1): Vergleiche nacheinander die besten Plätze
    for (let i = 0; i < a.tieBreakScores.length; i++) {
      if (a.tieBreakScores[i] !== b.tieBreakScores[i]) {
        return a.tieBreakScores[i] - b.tieBreakScores[i];
      }
    }
    return 0;
  });
}

  useEffect(() => {
    async function load() {
      const events: Event[] = await fetch("/api/events").then(r => r.json());
      const found = events.find(e => e.id === id);
      if (!found) return;

      setEvent(found);

      const accounts: Account[] = await fetch("/api/accounts").then(r => r.json());
      setVerein(accounts.find(a => a.id === found.vereinId) || null);

      // Standardklasse setzen
      if (found.bootsklassen.length > 0) {
        setSelectedClass(found.bootsklassen[0]);
      }
    }
    load();
  }, [id]);

  useEffect(() => {
  if (isInviteModalOpen && seglerId) {
    fetch(`/api/segler/${seglerId}/friends`)
  .then(res => {
    if (!res.ok) {
      console.error("Friends API Fehler:", res.status);
      return [];
    }
    return res.json();
  })
  .then(data => setUserFriends(data))
  .catch(err => console.error("Fehler beim Laden der Freunde", err));

  }
}, [isInviteModalOpen, seglerId]);

const sendInvitations = async () => {
  if (selectedFriends.length === 0) return;
  setIsSending(true);

  try {
    const res = await fetch('/api/friends/invite', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        senderId: seglerId,
        friendIds: selectedFriends,
        eventId: event?.id,
        eventName: event?.name
      })
    });

    if (res.ok) {
      alert(t("inviteSuccess"));
      setIsInviteModalOpen(false);
      setSelectedFriends([]);
      // Optional: Freundesliste neu laden, falls Status sich ändern soll
      // fetchFriends(); → diese Funktion musst du ggf. selbst implementieren
    } else {
      alert(t("inviteError"));
    }
  } catch (error) {
    console.error(t("inviteError"), error);
    alert(t("inviteError"));
  } finally {
    setIsSending(false);
  }
};


  function goToRegister(eventId: string, klasse: string) {
    if (!seglerId) {
      router.push("/login");
      return;
    }

    router.push(
      `/dashboard/segler/${seglerId}/registertoevent?eventId=${eventId}&klasse=${klasse}`
    );
  }

  useEffect(() => {
  if (activeTab !== "meldungen") return;
  if (!event) return;

  const currentClass = event.alleKlassen ? "GLOBAL" : selectedClass || event.bootsklassen[0];
  setSelectedClass(currentClass); // optional, falls du die UI aktualisieren willst

  async function loadMeldungen() {
    if (meldungen[currentClass]) return;
      if (!event) return;

    const updatedEvent: Event = await fetch(`/api/events?eventId=${event.id}`)
      .then(r => r.json());

    let seglerList: SeglerAnmeldung[] = [];
    if (currentClass === "GLOBAL" || event.alleKlassen) {
      seglerList = Object.values(updatedEvent.segler ?? {}).flat();
    } else {
      seglerList = updatedEvent.segler?.[currentClass] ?? [];
    }

    const res: Meldung[] = seglerList.map((entry, index) => ({
      id: `${entry.skipper.seglerId}-${index}`,
      skipperName: entry.skipper.name,
      skipperCountry: entry.skipper.countryCode,
      sailCountry: entry.boot.countryCode,
      sailNumber: entry.boot.segelnummer,
      bootName: entry.boot.bootName,
      bezahlt: entry.bezahlt,
      bootsklasse: entry.boot.bootsklasse ?? currentClass,
    }));

    setMeldungen(prev => ({ ...prev, [currentClass]: res }));
  }

  loadMeldungen();
}, [activeTab, event, selectedClass]);

useEffect(() => {
  // Wir laden die Ergebnisse, sobald der Tab aktiv ist
  if (activeTab !== "ergebnisse" || !event) return;

  async function loadResults() {
    // Wenn keine Klasse gewählt ist, nimm die erste verfügbare
    const klasseToLoad = selectedClass || event?.bootsklassen[0];
    if (!klasseToLoad) return;

    try {
      if (!event) return;
      const res = await fetch(`/api/events/results?eventId=${event.id}&klasse=${encodeURIComponent(klasseToLoad)}`);
      const data = await res.json();

      if (data.success && data.results) {
        setResultsData(prev => ({
          ...prev,
          [event.id]: {
            ...(prev[event.id] ?? {}),
            [klasseToLoad]: data.results
          }
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
    <h1 className="text-4xl font-bold text-white">{event!.name}</h1>
    <p className="text-white/80 mt-2">
      {event!.datumVon} – {event!.datumBis} · {event!.location}
    </p>
    <p className="text-white/60 mt-1">
      {t("details.organizer")}: {verein?.name || t("fallback")}
    </p>
  </div>

  {/* Dashboard Button */}
        <div className="flex gap-3">
          <button
            onClick={() => setIsInviteModalOpen(true)}
            className="bg-indigo-600/80 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl transition flex items-center gap-2 border border-indigo-500/30"
          >
            <span>👋</span> {t("inviteFriends")}
          </button>
          <button
            onClick={() => router.push(`/dashboard/segler/${seglerId}`)}
            className="bg-blue-600/50 text-white px-4 py-2 rounded hover:bg-blue-800/90 transition font-medium"
          >
            {t("backToDashboard")}
          </button>
        </div>
        {isInviteModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-slate-900 border border-white/10 w-full max-w-md rounded-[2.5rem] p-8 shadow-2xl">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-2xl font-black text-white italic uppercase tracking-tighter">
                    {t("inviteTitle.part1")} <span className="text-indigo-500">{t("inviteTitle.part2")}</span>
                  </h2>
                  <p className="text-xs text-slate-400 uppercase font-bold tracking-widest mt-1">
                    {t("selectFriends", { event: event?.name })}
                  </p>
                </div>
                <button onClick={() => setIsInviteModalOpen(false)} className="text-white/40 hover:text-white">✕</button>
              </div>
        
              <div className="max-h-64 overflow-y-auto space-y-2 pr-2 mb-8 custom-scrollbar">
                {userFriends.length > 0 ? (
                  /* Hier filtern wir Duplikate basierend auf der ID heraus */
                  userFriends
                    .filter((friend, index, self) => 
                      index === self.findIndex((f) => f.id === friend.id)
                    )
                    .map(friend => (
                      <div 
                        key={friend.id}
                        onClick={() => {
                          setSelectedFriends(prev => 
                            prev.includes(friend.id) ? prev.filter(id => id !== friend.id) : [...prev, friend.id]
                          )
                        }}
                        className={`flex items-center gap-4 p-4 rounded-2xl cursor-pointer transition border ${
                          selectedFriends.includes(friend.id) 
                          ? "bg-indigo-600/20 border-indigo-500 text-white" 
                          : "bg-white/5 border-transparent text-slate-400 hover:bg-white/10"
                        }`}
                      >
                        <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center font-black italic border border-white/10">
                          {friend.name?.substring(0,2).toUpperCase() ?? "??"}
                        </div>
                        <span className="font-bold uppercase italic text-sm">
                          {friend.name ?? t("unknown")}
                        </span>
                        {selectedFriends.includes(friend.id) && <span className="ml-auto text-indigo-400 font-bold">✓</span>}
                      </div>
                    ))
                ) : (
                  <p className="text-center text-slate-500 py-10 text-xs font-bold uppercase italic">{t("noFriends")}</p>
                )}
              </div>
        
              <button
                onClick={sendInvitations}
                disabled={selectedFriends.length === 0 || isSending}
                className="bg-blue-500 text-white px-4 py-2 rounded disabled:opacity-50 w-full"
              >
                {isSending ? t("sending") : t("sendInvite")}
              </button>

            </div>
          </div>
        )}
        </section>

      {/* TABS */}
      <div className="flex gap-4 border-b border-white/20">
        {["details", "bootsklassen", "meldungen", "ergebnisse", "dokumente"].map(tab => (
          <button
            key={tab}
            onClick={() => {
              setActiveTab(tab);
              setSelectedClass(event!.bootsklassen[0]);
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

        {/* DETAILS */}
        {activeTab === "details" && (
          <div className="space-y-6">
            <div className="space-y-2">
              <p><strong>{t("details.eventPeriod")}:</strong> {event!.datumVon} – {event!.datumBis}</p>
              <p><strong>{t("details.registrationPeriod")}:</strong> {event!.anmeldungVon} – {event!.anmeldungBis}</p>
              <p><strong>{t("details.organizer")}:</strong> {verein?.name || "—"}</p>
              <p><strong>{t("details.email")}:</strong> {verein?.email || "—"}</p>
              <p><strong>{t("details.address")}:</strong> {verein?.adresse || event!.location}</p>
            </div>

            {isInviteModalOpen!==true && Number.isFinite(event!.latitude) && Number.isFinite(event!.longitude) ? (
              <div className="h-80 w-full rounded-2xl overflow-hidden border border-white/10">
                <EventMap
                  lat={event!.latitude!}
                  lng={event!.longitude!}
                  title={event!.name}
                />
              </div>
            ) : (
              <div className="h-80 flex items-center justify-center rounded-2xl border border-white/10 text-white/60">
                {t("details.noCoordinates")}
              </div>
            )}
          </div>
        )}

        {/* BOOTSKLASSEN */}
        {activeTab === "bootsklassen" && (
          <div className="space-y-4">
            {event!.alleKlassen ? (
              <div className="flex justify-between bg-blue-800/40 p-4 rounded-xl">
                <span>{t("classes.openForAll")}</span>
                <button
                  onClick={() => goToRegister(event!.id, "GLOBAL")}
                  className="bg-blue-700 px-5 py-2 rounded-lg"
                >
                  {t("classes.registerNow")}
                </button>
              </div>
            ) : (
              event!.bootsklassen.map((cls) => (
                <div
                  key={cls}
                  className="flex justify-between bg-blue-800/40 p-4 rounded-xl"
                >
                  <span>{cls}</span>
                  <button
                    onClick={() => goToRegister(event!.id, cls)}
                    className="bg-blue-700 px-5 py-2 rounded-lg"
                  >
                    {t("classes.register")}
                  </button>
                </div>
              ))
            )}
          </div>
        )}

        {/* MELDUNGEN */}
        {activeTab === "meldungen" && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        
            {/* Klassenliste */}
            <ul className="space-y-2 border-r border-white/10 pr-4">
              {event!.bootsklassen.map((cls, index) => (
                <li
                  key={cls}
                  onClick={() => setSelectedClass(cls)}
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
          {t("entries.header", {
            klasse: selectedClass ?? event!.bootsklassen[0]
          })}
        </h3>
        <span className="text-white/70">
          {t('entries.sailors', { count: meldungen[selectedClass ?? event!.bootsklassen[0]]?.length ?? 0 })}
        </span>
      </div>

      {/* LISTE */}
      {(() => {
        const activeClass = selectedClass ?? event!.bootsklassen[0];
        const list = meldungen[activeClass] ?? [];

        if (!list.length) {
          return <p className="text-white/60">{t("entries.none")}</p>;
        }

        return (
          <ul className="space-y-2">
            {list.map(m => {
              const isOpen = openId === m.id;

              return (
                <li key={m.id} className="border border-white/10 rounded-xl overflow-hidden">

                  {/* COLLAPSED BUTTON */}
                  <button
                    onClick={() => setOpenId(isOpen ? null : m.id)}
                    className="w-full flex justify-between items-center px-4 py-3 hover:bg-blue-700/40 transition"
                  >
                    <div className="flex items-center gap-3 text-left">
                      {/* FLAGGE */}
                      <img
                        src={`https://flagcdn.com/w20/${
                          m.sailCountry ? sailCountryToFlag[m.sailCountry]?.toLowerCase() || "un" : "un"
                        }.png`}
                        alt={m.sailCountry || "un"}
                        className="h-4 w-6 rounded-sm"
                      />

                      {/* TEXT */}
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

                  {/* EXPANDED (Meldungen-Tab) */}
                  {isOpen && (
                    <div className="p-5 bg-blue-950/60 border-t border-white/10">
                      {/* Detail-Gitter analog zu den Ergebnissen */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-3 gap-x-8 text-sm text-white/80">
                        
                        {/* Linke Spalte: Personen */}
                        <div className="space-y-1">
                          <p className="text-white/40 text-[10px] uppercase font-bold mb-1 tracking-widest">{t("entries.people")}</p>
                          <p><strong>{t("entries.skipper")}</strong> :  {m.skipperName}</p>
                          {/* Platzhalter für Crew, falls im Meldung-Typ vorhanden oder geplant */}
                          <p><strong>{t("entries.crew")}</strong> : {(m as any).crew || "—"}</p>
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
        );
      })()}

    </div>

  </div>
)}


        {activeTab === "ergebnisse" && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {/* Klassenliste links */}
            <ul className="space-y-2 border-r border-white/10 pr-4">
              {(event?.alleKlassen ? ["GLOBAL", ...event.bootsklassen] : event!.bootsklassen).map((cls) => (
                <li
                  key={cls}
                  onClick={() => setSelectedClass(cls)}
                  className={`cursor-pointer p-2 rounded transition ${
                    (selectedClass === cls || (!selectedClass && event!.bootsklassen[0] === cls))
                      ? "bg-blue-700 text-white" : "hover:bg-blue-800/40 text-white/60"
                  }`}
                >
                  {cls}
                </li>
              ))}
            </ul>
        
            {/* Ergebnisliste rechts */}
            <div className="md:col-span-3 bg-blue-800/40 p-6 rounded-xl space-y-4 text-white">
              {(() => {
                const activeClass = selectedClass || event!.bootsklassen[0];
                const isGlobal = activeClass === "GLOBAL" || event?.alleKlassen;
                
                // Segler-Liste bestimmen
                const seglerList = isGlobal
                  ? Object.values(event?.segler ?? {}).flat()
                  : event?.segler?.[activeClass] ?? [];
        
                const eventResults = resultsData[event!.id]?.[activeClass] || {};
        
                if (seglerList.length === 0) {
                  return <p className="text-white/60 text-center py-10">{t("results.none")}</p>;
                }
        
                // Berechnung & Sortierung
                const scoredSegler = seglerList.map(s => {
                  const sId = s.skipper.seglerId;
                  const scoresRaw = eventResults[sId] || [];
                  
                  const numericScores = scoresRaw.map(val => {
                    const n = parseFloat(val);
                    return !isNaN(n) ? n : (seglerList.length + 1);
                  });
        
                  let discardIdx = -1;
                  if (numericScores.length >= 4) {
                    discardIdx = numericScores.indexOf(Math.max(...numericScores));
                  }
        
                  const total = numericScores.reduce((sum, val, i) => i === discardIdx ? sum : sum + val, 0);
                  return { s, scoresRaw, total, discardIdx };
                }).sort((a, b) => a.total - b.total);
        
                return (
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
                              {/* Flagge wie bei Meldungen */}
                              <img
                                src={`https://flagcdn.com/w20/${
                                  s.boot.countryCode ? sailCountryToFlag[s.boot.countryCode]?.toLowerCase() || "un" : "un"
                                }.png`}
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
                                    ? t('results.points', { points: total })
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
                                      <span className="text-[9px] mt-1 opacity-30">R{i+1}</span>
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
                );
              })()}
            </div>
          </div>
        )}

        {/* DOKUMENTE */}
        {activeTab === "dokumente" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Linke Seite: Liste der Dokumente */}
            <div className="space-y-3">
              <h3 className="text-white/40 text-[10px] uppercase font-bold tracking-widest mb-4">
                {t("documents.available")}
              </h3>
              {event!.documents.length === 0 && (
                <p className="text-white/40 italic text-sm">{t("documents.none")}</p>
              )}
              <ul className="space-y-2">
                {event!.documents.map(doc => (
                  <li key={doc.id}>
                    <button
                      onClick={() => setSelectedDoc(doc.url)} // Wir brauchen einen neuen State: const [selectedDoc, setSelectedDoc] = useState<string | null>(null);
                      className={`w-full flex items-center gap-3 p-4 rounded-xl border transition text-left ${
                        selectedDoc === doc.url 
                        ? "bg-blue-700 border-blue-500 text-white" 
                        : "bg-blue-900/20 border-white/10 text-white/70 hover:bg-blue-800/40"
                      }`}
                    >
                      <span className="text-2xl">
                        {doc.name.toLowerCase().includes("pdf") ? "📄" : "📝"}
                      </span>
                      <div className="flex-1 overflow-hidden">
                        <div className="font-semibold truncate">{doc.name}</div>
                        <div className="text-[10px] opacity-50 uppercase">{t("documents.viewDownload")}</div>
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
        
            {/* Rechte Seite: Dokumenten-Viewer */}
            <div className="lg:col-span-2">
              <div className="bg-blue-950/40 border border-white/10 rounded-2xl overflow-hidden h-[600px] flex flex-col">
                {selectedDoc ? (
                  <>
                    <div className="p-3 bg-white/5 border-b border-white/10 flex justify-between items-center">
                      <span className="text-xs text-white/50 truncate pr-4">{selectedDoc}</span>
                      <a 
                        href={selectedDoc} 
                        target="_blank" 
                        rel="noreferrer"
                        className="bg-blue-600 hover:bg-blue-500 text-white text-[10px] font-bold px-3 py-1 rounded-md transition"
                      >
                        {t("documents.openExternal")}
                      </a>
                    </div>
                    <iframe
                      src={selectedDoc}
                      className="w-full h-full bg-white"
                      title={t("documents.previewTitle")}
                    />
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-white/30 space-y-4">
                    <span className="text-5xl opacity-20">🔎</span>
                    <p className="text-sm">{t("documents.selectToPreview")}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </section>
    </div>
  </main>
)
};
