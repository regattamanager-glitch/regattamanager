'use client';

import { useEffect, useState, useMemo } from "react";
import { useParams } from "next/navigation";
import dynamic from 'next/dynamic';
import dayjs from "dayjs";
import 'dayjs/locale/de';
import { Search, Map as MapIcon, List, Calendar, MapPin, ChevronRight, Anchor, Wind, Loader2, ArrowLeft} from 'lucide-react';
import { useRouter } from "@/navigation";
import { useTranslations } from "next-intl";

interface RegattaMapProps {
  events: any[];
  onMarkerClick: (coords: { lat: number, lng: number }) => void;
}

const RegattaMap = dynamic<RegattaMapProps>( () => import('@/components/RegattaMap'), 
  { 
    ssr: false,
    loading: () => (
      <div className="h-[600px] w-full bg-[#1e293b] animate-pulse rounded-[4rem] flex items-center justify-center border-4 border-slate-800">
        <Loader2 className="w-10 h-10 text-sky-400 animate-spin" />
      </div>
    )
  }
);

dayjs.locale('de');

const BOOTSKLASSEN = [
  "ILCA","ILCA 4","ILCA 6","ILCA 7","Optimist","420","470","49er","49erFX",
  "Finn","Europe","RS:X","iQFoil","Nacra 17","Nacra 15","Vaurien","FJ","Fireball","505",
  "Hobie Cat 16","RS Aero","OK Dinghy","Topper","Dragon","Star","Soling", 
  "Flying Dutchman","Tornado","J70","J80","Snipe","RS200","RS400","RS500",
  "RS700","RS800","RS100","Moth","Formula 18","A-Cat","Elliott 6m","O-Jolle","Firefly",
  "Sharpie","Swallow ","Tempest","Laser II","International 14","RS Feva","RS Vision",
  "Yngling","5,5m-R-Klasse","6m-R-Klasse","J24","8m-R-Klasse","Contender","Splash","Zoom8",
  "Sunfish","B14","Musto Skiff","RS Tera","O’pen BIC"
];

export default function RegattaÜbersicht({ currentUser }: { currentUser: any }) {
  const t = useTranslations("RegattaFinder");
  const router = useRouter();
  const params = useParams();
  const seglerId = params.seglerId as string;

  const [events, setEvents] = useState<any[]>([]);
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
  const [search, setSearch] = useState("");
  const [filterLand, setFilterLand] = useState("");
  const [filterYear, setFilterYear] = useState("");
  const [filterBootsklasse, setFilterBootsklasse] = useState("");
  const [mapFilter, setMapFilter] = useState<{lat: number, lng: number} | null>(null);

  useEffect(() => {
    async function fetchEvents() {
      try {
        const [resEvents, resAccounts] = await Promise.all([
          fetch("/api/events"),
          fetch("/api/accounts")
        ]);
        const eventsData = await resEvents.json();
        const accounts = await resAccounts.json();

        const mappedEvents = eventsData.map((e: any) => ({
          ...e,
          lat: e.latitude, 
          lng: e.longitude,
          verein: accounts.find((acc: any) => acc.id === e.vereinId)?.name ?? t('noClubFallback'),
        }));
        setEvents(mappedEvents);
      } catch (err) { console.error(err); }
    }
    fetchEvents();
  }, [t]);

  const filtered = useMemo(() => {
    const heute = dayjs().startOf('day');
    return events.filter((e) => {
      const eventDate = dayjs(e.datumVon);
      if (e.privat === true) return false;

      const matchesMap = mapFilter 
        ? (e.lat?.toFixed(4) === mapFilter.lat.toFixed(4) && e.lng?.toFixed(4) === mapFilter.lng.toFixed(4))
        : true;

      return (
        matchesMap &&
        eventDate.isAfter(heute) &&
        e.name.toLowerCase().includes(search.toLowerCase()) &&
        (filterLand ? e.land?.toLowerCase().includes(filterLand.toLowerCase()) : true) &&
        (filterYear ? eventDate.year().toString() === filterYear : true) &&
        (filterBootsklasse ? e.bootsklassen?.includes(filterBootsklasse) : true)
      );
    });
  }, [events, search, filterLand, filterYear, filterBootsklasse, mapFilter]);

  return (
    <div className="min-h-screen bg-[#0f172a] text-slate-200 rounded-[2.5rem] pb-20 overflow-x-hidden">
      
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[70%] h-[70%] bg-sky-900/20 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-5%] right-[-5%] w-[50%] h-[50%] bg-blue-900/20 blur-[100px] rounded-full" />
      </div>

      <main className="max-w-6xl mx-auto px-6 pt-12 relative z-10">

        <button 
          onClick={() => router.back()}
          className="group mb-8 flex items-center gap-3 text-slate-400 hover:text-sky-400 transition-all font-bold uppercase italic text-xs tracking-widest"
        >
          <div className="p-2 bg-slate-800/50 border border-white/5 rounded-xl group-hover:border-sky-500/30 group-hover:bg-sky-500/10 transition-all">
            <ArrowLeft className="w-4 h-4" />
          </div>
          {t('back')}
        </button>
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 mb-12">
          <div>
            <div className="flex items-center gap-4 mb-2">
              <div className="p-3 bg-sky-500/10 border border-sky-500/20 rounded-[1.8rem]">
                <Wind className="text-sky-400 w-8 h-8" />
              </div>
              <h1 className="text-4xl font-black italic uppercase tracking-tighter text-white">
                Regatta <span className="text-sky-400">Finder</span>
              </h1>
            </div>
            <p className="text-slate-400 font-medium ml-1">{t('subtitle')}</p>
          </div>

          <div className="flex bg-slate-800/50 backdrop-blur-xl p-1.5 rounded-full border border-white/5 shadow-2xl">
            <button 
              onClick={() => setViewMode('list')}
              className={`flex items-center gap-2 px-8 py-3 rounded-full text-sm font-bold transition-all ${viewMode === 'list' ? 'bg-sky-500 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
            >
              <List className="w-4 h-4" /> {t('viewList')}
            </button>
            <button 
              onClick={() => setViewMode('map')}
              className={`flex items-center gap-2 px-8 py-3 rounded-full text-sm font-bold transition-all ${viewMode === 'map' ? 'bg-sky-500 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
            >
              <MapIcon className="w-4 h-4" /> {t('viewMap')}
            </button>
          </div>
        </div>

        {mapFilter && (
          <div className="flex justify-center mb-6">
            <button 
              onClick={() => setMapFilter(null)}
              className="bg-sky-500/20 border border-sky-500/40 text-sky-400 px-6 py-2 rounded-full text-xs font-bold animate-bounce flex items-center gap-2 hover:bg-sky-500 hover:text-white transition-all"
            >
              <MapPin className="w-3 h-3" /> {t('mapFilterActive')}
            </button>
          </div>
        )}

        <div className="bg-slate-800/40 backdrop-blur-2xl border border-white/10 rounded-[2.5rem] p-5 mb-12 shadow-2xl">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-sky-400/60" />
              <input
                type="text"
                placeholder={t('placeholderName')}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-[#1e293b]/60 border-none rounded-full py-3.5 pl-12 pr-6 text-sm text-white focus:ring-2 focus:ring-sky-500/50 transition-all placeholder:text-slate-500 shadow-inner"
              />
            </div>
            <input
              type="text"
              placeholder={t('placeholderCountry')}
              value={filterLand}
              onChange={(e) => setFilterLand(e.target.value)}
              className="bg-[#1e293b]/60 border-none rounded-full py-3.5 px-8 text-sm text-white focus:ring-2 focus:ring-sky-500/50 transition-all placeholder:text-slate-500 shadow-inner"
            />
            <select
              value={filterBootsklasse}
              onChange={(e) => setFilterBootsklasse(e.target.value)}
              className="bg-[#1e293b]/60 border-none rounded-full py-3.5 px-8 text-sm text-slate-300 appearance-none focus:ring-2 focus:ring-sky-500/50 shadow-inner"
            >
              <option value="">{t('allClasses')}</option>
              {BOOTSKLASSEN.map(b => <option key={b} value={b}>{b}</option>)}
            </select>
            <div className="flex items-center gap-3 bg-[#1e293b]/60 rounded-full px-6 shadow-inner">
              <Calendar className="w-4 h-4 text-sky-400" />
              <input
                type="number"
                placeholder={t('placeholderYear')}
                value={filterYear}
                onChange={(e) => setFilterYear(e.target.value)}
                className="bg-transparent border-none w-full py-3.5 text-sm text-white focus:ring-0 placeholder:text-slate-500"
              />
            </div>
          </div>
        </div>

        <div className="transition-all duration-700">
          {viewMode === 'map' ? (
            <div className="h-[650px] w-full rounded-[4rem] overflow-hidden border-[8px] border-slate-800/40 shadow-2xl relative">
              <RegattaMap 
                events={filtered} 
                onMarkerClick={(coords: {lat: number, lng: number}) => {
                  setMapFilter(coords);
                  setViewMode('list'); 
                }} 
              />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {filtered.length === 0 ? (
                <div className="col-span-full py-24 text-center bg-slate-800/20 rounded-[3.5rem] border border-dashed border-slate-700/50">
                  <Anchor className="w-16 h-16 text-slate-700 mx-auto mb-4" />
                  <p className="text-slate-500 font-bold text-xl uppercase tracking-tighter italic px-4">
                    {t('noEvents')}
                  </p>
                </div>
              ) : (
                filtered.map((event) => {
                  const classCount = Object.keys(event.bootsklassen || {}).length;
                  return (
                    <div 
                      key={event.id}
                      onClick={() => router.push(`/regatta/${event.id}?seglerId=${seglerId}`)}
                      className="group bg-slate-800/30 border border-white/5 p-8 rounded-[3rem] flex items-center justify-between hover:bg-sky-900/20 hover:border-sky-500/30 transition-all cursor-pointer shadow-xl"
                    >
                      <div className="flex flex-col gap-3">
                        <div className="flex items-center gap-3">
                          <span className="bg-sky-500/10 text-sky-400 text-[10px] font-black uppercase tracking-widest px-4 py-1.5 rounded-full border border-sky-500/20">
                            {classCount > 10 
                              ? t('moreThanTenClasses') 
                              : classCount > 1 
                                ? `${classCount} ${t('classesLabel')}` 
                                : event.bootsklassen?.[0] || t('openClass')}
                          </span>
                          <div className="flex items-center gap-1.5 text-slate-500 text-xs font-bold">
                            <Calendar className="w-3.5 h-3.5 text-sky-500" />
                            {dayjs(event.datumVon).format('DD.MM.YY')}
                          </div>
                        </div>
                        <h2 className="text-2xl font-bold text-white group-hover:text-sky-400 transition-colors leading-tight">
                          {event.name}
                        </h2>
                        <div className="flex items-center gap-2 text-slate-400 text-sm font-medium opacity-70">
                          <MapPin className="w-4 h-4 text-sky-400" />
                          {event.location}
                        </div>
                      </div>
                      <div className="h-14 w-14 bg-slate-900/50 rounded-[1.5rem] flex items-center justify-center group-hover:bg-sky-500 transition-all shadow-inner border border-white/5">
                        <ChevronRight className="w-6 h-6 text-slate-600 group-hover:text-white" />
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}