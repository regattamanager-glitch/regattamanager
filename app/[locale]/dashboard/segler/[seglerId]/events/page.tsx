'use client';

import { useEffect, useState, useMemo } from "react";
import { useParams } from "next/navigation";
import dynamic from 'next/dynamic';
import dayjs from "dayjs";
import 'dayjs/locale/de';
import { 
  Search, Map as MapIcon, List, Calendar, MapPin, 
  ChevronRight, Anchor, Wind, Loader2, ArrowLeft, 
  CheckCircle2, FilterX 
} from 'lucide-react';
import { useRouter } from "@/navigation";
import { useTranslations } from "next-intl";

interface RegattaMapProps {
  events: any[];
  onMarkerClick: (coords: { lat: number, lng: number }) => void;
}

const RegattaMap = dynamic<RegattaMapProps>(() => import('@/components/RegattaMap'), {
  ssr: false,
  loading: () => (
    <div className="h-[600px] w-full bg-[#1e293b] animate-pulse rounded-[4rem] flex items-center justify-center border-4 border-slate-800">
      <Loader2 className="w-10 h-10 text-sky-400 animate-spin" />
    </div>
  )
});

dayjs.locale('de');

const BOOTSKLASSEN = [
  "ILCA", "ILCA 4", "ILCA 6", "ILCA 7", "Optimist", "420", "470", "49er", "49erFX", "29er",
  "Finn", "Europe", "RS:X", "iQFoil", "Nacra 17", "Nacra 15", "Vaurien", "FJ", "Fireball", "505",
  "Hobie Cat 16", "RS Aero", "OK Dinghy", "Topper", "Dragon", "Star", "Soling",
  "Flying Dutchman", "Tornado", "J70", "J80", "Snipe", "RS200", "RS400", "RS500",
  "RS700", "RS800", "RS100", "Moth", "Formula 18", "A-Cat", "Elliott 6m", "O-Jolle", "Firefly",
  "Sharpie", "Swallow ", "Tempest", "Laser II", "International 14", "RS Feva", "RS Vision",
  "Yngling", "5,5m-R-Klasse", "6m-R-Klasse", "J24", "8m-R-Klasse", "Contender", "Splash", "Zoom8",
  "Sunfish", "B14", "Musto Skiff", "RS Tera", "O’pen BIC"
];

export default function RegattaÜbersicht() {
  const t = useTranslations("RegattaFinder");
  const router = useRouter();
  const params = useParams();
  
  const seglerId = params.seglerId ? String(params.seglerId) : "";

  const [events, setEvents] = useState<any[]>([]);
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
  const [search, setSearch] = useState("");
  const [filterLand, setFilterLand] = useState("");
  const [filterYear, setFilterYear] = useState("");
  const [filterBootsklasse, setFilterBootsklasse] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterExcludeRegistered, setFilterExcludeRegistered] = useState(false);
  const [mapFilter, setMapFilter] = useState<{ lat: number, lng: number } | null>(null);
  
  const [myRegisteredEventIds, setMyRegisteredEventIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const getStatusInfo = (event: any) => {
    const today = dayjs().startOf('day');
    const openDate = event.anmeldungs_von ? dayjs(event.anmeldungs_von).startOf('day') : null;
    const closeDate = event.anmeldungs_bis ? dayjs(event.anmeldungs_bis).startOf('day') : null;
    const eventEndDate = dayjs(event.datum_bis || event.datumBis).startOf('day');

    if (openDate && today.isBefore(openDate)) {
      return { label: "Bald", color: "text-amber-400 bg-amber-400/10 border-amber-400/20", type: 'COMING' };
    }
    if (openDate && closeDate && today.isAfter(openDate.subtract(1, 'day')) && today.isBefore(closeDate.add(1, 'day'))) {
      return { label: "Offen", color: "text-emerald-400 bg-emerald-400/10 border-emerald-400/20", type: 'OPEN' };
    }
    if (today.isAfter(eventEndDate)) {
      return { label: "Beendet", color: "text-slate-500 bg-slate-500/10 border-slate-500/20", type: 'FINISHED' };
    }
    return { label: "Geschlossen", color: "text-red-400 bg-red-400/10 border-red-400/20", type: 'CLOSED' };
  };

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const resEvents = await fetch("/api/events");
        const eventsData = await resEvents.json();

        const registrationPromises = eventsData.map(async (event: any) => {
          try {
            const res = await fetch(`/api/registrations?eventId=${event.id}`);
            if (!res.ok) return null;
            const registrations = await res.json();
            const isRegistered = registrations.some((reg: any) => 
              String(reg.seglerId || reg.seglerid) === seglerId
            );
            return isRegistered ? String(event.id) : null;
          } catch { return null; }
        });

        const registeredIds = (await Promise.all(registrationPromises)).filter(id => id !== null) as string[];
        setMyRegisteredEventIds(registeredIds);

        const resAccounts = await fetch("/api/accounts");
        const accounts = await resAccounts.json();

        const mappedEvents = eventsData.map((e: any) => ({
          ...e,
          id: String(e.id),
          lat: e.latitude,
          lng: e.longitude,
          verein: accounts.find((acc: any) => String(acc.id) === String(e.vereinId))?.name ?? t('noClubFallback'),
        }));

        setEvents(mappedEvents);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    if (seglerId) fetchData();
  }, [seglerId, t]);

  const filtered = useMemo(() => {
    return events.filter((e) => {
      const isRegistered = myRegisteredEventIds.includes(e.id);
      const status = getStatusInfo(e);
      const eventDate = dayjs(e.datumVon);

      const matchesSearch = e.name.toLowerCase().includes(search.toLowerCase());
      const matchesLand = filterLand ? e.land?.toLowerCase().includes(filterLand.toLowerCase()) : true;
      const matchesYear = filterYear ? eventDate.year().toString() === filterYear : true;
      const matchesClass = filterBootsklasse ? e.bootsklassen?.includes(filterBootsklasse) : true;
      const matchesStatus = filterStatus ? status.type === filterStatus : true;
      const matchesExcludeRegistration = filterExcludeRegistered ? !isRegistered : true;

      return matchesSearch && matchesLand && matchesYear && matchesClass && matchesStatus && matchesExcludeRegistration;
    });
  }, [events, search, filterLand, filterYear, filterBootsklasse, filterStatus, filterExcludeRegistered, myRegisteredEventIds]);

  if (loading) return <div className="min-h-screen bg-[#0f172a] flex items-center justify-center"><Loader2 className="w-12 h-12 text-sky-500 animate-spin" /></div>;

  return (
    <div className="min-h-screen bg-[#0f172a] text-slate-200 rounded-[2.5rem] pb-20 overflow-x-hidden">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[70%] h-[70%] bg-sky-900/20 blur-[120px] rounded-full" />
      </div>

      <main className="max-w-6xl mx-auto px-6 pt-12 relative z-10">
        <button onClick={() => router.back()} className="group mb-8 flex items-center gap-3 text-slate-400 hover:text-sky-400 transition-all font-bold uppercase italic text-xs tracking-widest">
          <ArrowLeft className="w-4 h-4" /> {t('back')}
        </button>
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 mb-12">
          <h1 className="text-4xl font-black italic uppercase tracking-tighter text-white">
            Regatta <span className="text-sky-400">Manager</span>
          </h1>

          <div className="flex bg-slate-800/50 backdrop-blur-xl p-1.5 rounded-full border border-white/5 shadow-2xl">
            <button onClick={() => setViewMode('list')} className={`px-6 py-2.5 rounded-full text-xs font-bold transition-all ${viewMode === 'list' ? 'bg-sky-500 text-white' : 'text-slate-400'}`}>
              <List className="w-3.5 h-3.5 inline mr-1.5" /> Liste
            </button>
            <button onClick={() => setViewMode('map')} className={`px-6 py-2.5 rounded-full text-xs font-bold transition-all ${viewMode === 'map' ? 'bg-sky-500 text-white' : 'text-slate-400'}`}>
              <MapIcon className="w-3.5 h-3.5 inline mr-1.5" /> Karte
            </button>
          </div>
        </div>

        {/* SCHMÄLERES HORIZONTALES FILTER PANEL */}
        <div className="bg-slate-800/40 backdrop-blur-2xl border border-white/10 rounded-[2rem] p-3 mb-12 shadow-2xl overflow-x-auto">
          <div className="flex flex-wrap md:flex-nowrap items-center gap-2 min-w-max">
            
            <div className="relative flex-grow min-w-[160px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-sky-400/60" />
              <input type="text" placeholder="Suchen..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full bg-[#1e293b]/60 border-none rounded-full py-2.5 pl-9 pr-4 text-[11px] text-white focus:ring-2 focus:ring-sky-500/50" />
            </div>

            <input type="text" placeholder="Land" value={filterLand} onChange={(e) => setFilterLand(e.target.value)} className="bg-[#1e293b]/60 border-none rounded-full py-2.5 px-4 text-[11px] text-white w-20" />

            <select value={filterBootsklasse} onChange={(e) => setFilterBootsklasse(e.target.value)} className="bg-[#1e293b]/60 border-none rounded-full py-2.5 px-4 text-[11px] text-slate-300 w-28">
              <option value="">Klasse</option>
              {BOOTSKLASSEN.map(b => <option key={b} value={b} className="bg-slate-900">{b}</option>)}
            </select>

            <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="bg-[#1e293b]/60 border-none rounded-full py-2.5 px-4 text-[11px] text-sky-400 font-bold w-28">
              <option value="" className="text-slate-300 font-normal">Status</option>
              <option value="OPEN">Offen</option>
              <option value="COMING">Bald</option>
              <option value="CLOSED">Geschlossen</option>
              <option value="FINISHED">Beendet</option>
            </select>

            <button
              onClick={() => setFilterExcludeRegistered(!filterExcludeRegistered)}
              className={`flex items-center gap-1.5 px-4 py-2.5 rounded-full text-[11px] font-bold transition-all border ${
                filterExcludeRegistered ? 'bg-orange-500 border-orange-400 text-white shadow-lg shadow-orange-500/20' : 'bg-[#1e293b]/60 border-transparent text-slate-400'
              }`}
            >
              <CheckCircle2 className="w-3 h-3" /> Nicht Gemeldet
            </button>

            <div className="flex items-center gap-1.5 bg-[#1e293b]/60 rounded-full px-3">
              <Calendar className="w-3 h-3 text-sky-400" />
              <input type="number" placeholder="Jahr" value={filterYear} onChange={(e) => setFilterYear(e.target.value)} className="bg-transparent border-none py-2.5 text-[11px] text-white w-12 focus:ring-0 placeholder:text-slate-500" />
            </div>

            {(search || filterLand || filterBootsklasse || filterStatus || filterYear || filterExcludeRegistered) && (
              <button onClick={() => {setSearch(""); setFilterLand(""); setFilterBootsklasse(""); setFilterStatus(""); setFilterYear(""); setFilterExcludeRegistered(false);}} className="p-2.5 bg-red-500/10 text-red-400 rounded-full hover:bg-red-500 hover:text-white transition-all"><FilterX className="w-3.5 h-3.5" /></button>
            )}
          </div>
        </div>

        {viewMode === 'list' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filtered.map((event) => {
              const status = getStatusInfo(event);
              const isRegistered = myRegisteredEventIds.includes(event.id);
              return (
                <div key={event.id} onClick={() => router.push(`/regatta/${event.id}?seglerId=${seglerId}`)} className="group bg-slate-800/30 border border-white/5 p-7 rounded-[3rem] flex flex-col hover:bg-sky-900/20 transition-all cursor-pointer relative shadow-xl">
                  <div className="flex justify-between items-start mb-6">
                    <div className="flex gap-2">
                      <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${status.color}`}>
                        {status.label}
                      </span>
                      {isRegistered && (
                        <span className="bg-emerald-500 text-white px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> Gemeldet
                        </span>
                      )}
                    </div>
                  </div>
                  <h2 className="text-2xl font-bold text-white group-hover:text-sky-400 transition-colors mb-6 italic line-clamp-2">{event.name}</h2>
                  <div className="mt-auto flex items-end justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-slate-400 text-sm font-medium"><MapPin className="w-4 h-4 text-sky-400" /> {event.location}</div>
                      <div className="flex items-center gap-2 text-slate-500 text-xs font-bold uppercase tracking-widest"><Calendar className="w-4 h-4 text-sky-500" /> {dayjs(event.datumVon).format('DD.MM.YYYY')}</div>
                    </div>
                    <div className="h-12 w-12 bg-slate-900/50 rounded-2xl flex items-center justify-center group-hover:bg-sky-500 transition-all shadow-inner border border-white/5">
                      <ChevronRight className="w-5 h-5 group-hover:text-white" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="h-[650px] w-full rounded-[4rem] overflow-hidden border-[8px] border-slate-800/40 shadow-2xl relative">
            <RegattaMap events={filtered} onMarkerClick={(coords: any) => { setMapFilter(coords); setViewMode('list'); }} />
          </div>
        )}
      </main>
    </div>
  );
}