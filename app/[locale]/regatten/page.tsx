'use client';

import { useEffect, useState } from "react";
import { Link } from "@/navigation";
import { useTranslations } from "next-intl";

interface Event {
  id: string;
  name: string;
  datum_von: string;
  datum_bis: string;
  anmeldungs_von: string;
  anmeldungs_bis: string;
  location: string;
  land: string;
  verein?: string;
  verein_id?: string;
  vereinId?: string;
  bootsklassen: string[];
}

const BOOTSKLASSEN = [
  "ILCA", "ILCA 4", "ILCA 6", "ILCA 7", "Optimist", "420", "470", "49er", "49erFX", "29er",
  "Finn", "Europe", "RS:X", "iQFoil", "Nacra 17", "Nacra 15", "Vaurien", "FJ", "Fireball", "505",
  "Hobie Cat 16", "RS Aero", "OK Dinghy", "Topper", "Dragon", "Star", "Soling",
  "Flying Dutchman", "Tornado", "J70", "J80", "Snipe", "RS200", "RS400", "RS500",
  "RS700", "RS800", "RS100", "Moth", "Formula 18", "A-Cat", "Elliott 6m", "O-Jolle", "Firefly",
  "Sharpie", "Swallow ", "Tempest", "Laser II", "International 14", "RS Feva", "RS Vision",
  "Yngling", "5,5m-R-Klasse", "6m-R-Klasse", "J24", "8m-R-Klasse", "Contender", "Splash", "Zoom8",
  "Sunfish", "B14", "Musto Skiff", "RS Tera", "O’pen BIC", "Sonstige"
];

export default function RegattaÜbersicht() {
    const t = useTranslations("");
  const [events, setEvents] = useState<Event[]>([]);
  const [search, setSearch] = useState("");
  const [filterLand, setFilterLand] = useState("");
  const [filterBootsklasse, setFilterBootsklasse] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  useEffect(() => {
    async function fetchData() {
      try {
        const [resEvents, resAccounts] = await Promise.all([
          fetch("/api/events"),
          fetch("/api/accounts")
        ]);
        const eventsData: Event[] = await resEvents.json();
        const accounts: any[] = await resAccounts.json();

        const mapped = eventsData.map((e) => {
          const vID = e.verein_id || e.vereinId;
          const account = accounts.find(acc => String(acc.id || acc._id) === String(vID));
          return {
            ...e,
            verein: account ? (account.name || account.username || account.verein) : "—",
          };
        });
        setEvents(mapped);
      } catch (err) {
        console.error("Data loading error:", err);
      }
    }
    fetchData();
  }, []);

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "—";
    const date = new Date(dateStr);
    return isNaN(date.getTime()) ? dateStr : date.toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const getStatusInfo = (event: Event) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const openDate = event.anmeldungs_von ? new Date(event.anmeldungs_von) : null;
    const closeDate = event.anmeldungs_bis ? new Date(event.anmeldungs_bis) : null;
    const eventEndDate = new Date(event.datum_bis);

    if (openDate && today < openDate) {
      return { 
        type: 'COMING',
        label: t('Regatta.statusNotOpen'),
        style: "bg-amber-500/10 text-amber-500 border-amber-500/20",
        btnLabel: t('Regatta.viewDetails'),
        btnLink: `/regatta/${event.id}`,
        btnStyle: "bg-blue-600 text-white shadow-lg" 
      };
    } 
    if (openDate && closeDate && today >= openDate && today <= closeDate) {
      return { 
        type: 'OPEN',
        label: t('Regatta.statusOpen'),
        style: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
        btnLabel: t('Regatta.registerNow'),
        btnLink: `/regatta/${event.id}`,
        btnStyle: "bg-emerald-600 text-white shadow-lg" 
      };
    }
    if (closeDate && today > closeDate && today <= eventEndDate) {
      return { 
        type: 'CLOSED',
        label: t('Regatta.statusClosed'), 
        style: "bg-red-500/10 text-red-500 border-red-500/20",
        btnLabel: t('Regatta.viewDetails'),
        btnLink: `/regatta/${event.id}`,
        btnStyle: "bg-blue-600 text-white shadow-lg" 
      };
    }
    return { 
      type: 'FINISHED',
      label: t('Regatta.statusFinished'), 
      style: "bg-gray-500/10 text-gray-400 border-gray-500/20",
      btnLabel: t('Regatta.results'),
      btnLink: `/regatta/${event.id}`,
      btnStyle: "bg-indigo-600 text-white shadow-lg" 
    };
  };

  const filtered = events.filter((e) => {
    const status = getStatusInfo(e);
    return (
      e.name.toLowerCase().includes(search.toLowerCase()) &&
      (filterLand ? e.land?.toLowerCase().includes(filterLand.toLowerCase()) : true) &&
      (filterBootsklasse ? e.bootsklassen.includes(filterBootsklasse) : true) &&
      (filterStatus ? status.type === filterStatus : true)
    );
  });

  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const currentItems = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <div className="min-h-screen bg-transparent text-white p-4 md:p-12">
      <div className="max-w-6xl mx-auto relative">
        
        {/* Zurück Knopf */}
        <Link href="/" className="inline-flex items-center gap-2 mb-8 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-gray-400 hover:text-white hover:bg-white/10 transition-all group">
          <span className="group-hover:-translate-x-1 transition-transform">←</span>
          <span className="text-xs font-bold uppercase tracking-widest italic">{t('Common.back')}</span>
        </Link>

        {/* Header */}
        <div className="mb-12 flex flex-col items-center text-center">
          <h1 className="text-5xl md:text-7xl font-black tracking-tighter mb-4 bg-clip-text text-transparent bg-gradient-to-b from-white to-gray-500 uppercase italic">
            {t('Regatta.pageTitle')}
          </h1>
          <div className="h-1.5 w-32 bg-blue-600 rounded-full mb-6 shadow-[0_0_20px_rgba(37,99,235,0.6)]"></div>
          <p className="text-[11px] text-gray-400 max-w-md uppercase tracking-[0.2em] font-bold">
            {t('Regatta.pageSubtitle')}
          </p>
        </div>

        {/* Filter Panel */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-12 p-6 bg-black/40 backdrop-blur-2xl rounded-[2.5rem] border border-white/10 shadow-2xl">
          <input
            type="text"
            placeholder={t('Regatta.searchPlaceholder')}
            value={search}
            onChange={(e) => {setSearch(e.target.value); setCurrentPage(1);}}
            className="p-4 rounded-2xl bg-black/60 border border-white/20 text-white placeholder:text-gray-500 focus:border-blue-500 outline-none transition-all"
          />
          
          <input
            type="text"
            placeholder={t('Regatta.filterCountry')}
            value={filterLand}
            onChange={(e) => {setFilterLand(e.target.value); setCurrentPage(1);}}
            className="p-4 rounded-2xl bg-black/60 border border-white/20 text-white placeholder:text-gray-500 focus:border-blue-500 outline-none transition-all"
          />

          <select
            value={filterBootsklasse}
            onChange={(e) => {setFilterBootsklasse(e.target.value); setCurrentPage(1);}}
            className="p-4 rounded-2xl bg-black/60 border border-white/20 text-white font-medium focus:border-blue-500 outline-none cursor-pointer"
          >
            <option value="">{t('Regatta.allClasses')}</option>
            {BOOTSKLASSEN.map(cls => <option key={cls} value={cls} className="bg-gray-900">{cls}</option>)}
          </select>

          <select
            value={filterStatus}
            onChange={(e) => {setFilterStatus(e.target.value); setCurrentPage(1);}}
            className="p-4 rounded-2xl bg-black/60 border border-white/20 text-blue-400 font-bold focus:border-blue-500 outline-none cursor-pointer"
          >
            <option value="" className="text-white font-normal">{t('Regatta.status')}</option>
            <option value="OPEN" className="text-emerald-400">{t('Regatta.statusOpen')}</option>
            <option value="COMING" className="text-amber-400">{t('Regatta.statusNotOpen')}</option>
            <option value="CLOSED" className="text-red-400">{t('Regatta.statusClosed')}</option>
            <option value="FINISHED" className="text-gray-400">{t('Regatta.statusFinished')}</option>
          </select>
        </div>

        {/* Grid - Jede Karte ist ein kompletter Link */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {currentItems.map((event) => {
            const status = getStatusInfo(event);
            return (
              <Link 
                key={event.id} 
                href={status.btnLink}
                className="group relative transition-all duration-500 hover:scale-[1.02] flex"
              >
                <div className="w-full p-8 rounded-[3rem] bg-gradient-to-br from-gray-900/90 to-black/60 backdrop-blur-md border border-white/5 transition-all duration-500 group-hover:border-blue-500/50 group-hover:shadow-[0_20px_50px_rgba(0,0,0,0.5)] flex flex-col">
                  
                  <div className="flex justify-between items-start mb-8">
                    <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border ${status.style}`}>
                      {status.label}
                    </span>
                    <span className="text-gray-600 font-mono text-[10px] bg-white/5 px-3 py-1 rounded-lg italic">ID: {event.id.slice(-4)}</span>
                  </div>

                  <h2 className="text-3xl md:text-4xl font-bold mb-6 group-hover:text-blue-400 transition-colors tracking-tight italic">
                    {event.name}
                  </h2>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
                    <div className="flex items-start gap-3 p-4 rounded-2xl bg-white/5 border border-white/5 min-h-[80px]">
                      <span className="text-2xl">📅</span>
                      <div>
                        <p className="text-[9px] uppercase text-gray-500 font-bold mb-1">{t('Regatta.date')}</p>
                        <p className="text-sm font-medium leading-snug italic">{formatDate(event.datum_von)}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 p-4 rounded-2xl bg-white/5 border border-white/5 min-h-[80px]">
                      <span className="text-2xl opacity-80">📍</span>
                      <div>
                        <p className="text-[9px] uppercase text-gray-500 font-bold mb-1">{t('Regatta.location')}</p>
                        <p className="text-sm font-medium leading-snug italic">{event.location}</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-8 border-t border-white/10 mt-auto">
                    <div className="max-w-[50%]">
                      <p className="text-[10px] uppercase text-blue-500 font-black tracking-widest leading-none mb-1.5">
                        {t('Regatta.organizer')}
                      </p>
                      <p className="text-sm font-bold text-white/80 line-clamp-1 italic">{event.verein}</p>
                    </div>

                    {/* Visueller Button-Indikator */}
                    <div className={`px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all ${status.btnStyle}`}>
                      {status.btnLabel}
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

        {/* Pagination Container */}
        {totalPages > 1 && (
          <div className="mt-20 flex justify-center p-4 bg-black/40 backdrop-blur-xl rounded-[2rem] border border-white/5 w-fit mx-auto gap-3 shadow-2xl">
            {[...Array(totalPages)].map((_, i) => (
              <button
                key={i}
                onClick={() => { setCurrentPage(i + 1); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                className={`w-12 h-12 rounded-xl font-black text-sm transition-all duration-300 border ${
                  currentPage === i + 1 
                  ? 'bg-blue-600 border-blue-500 text-white shadow-[0_0_20px_rgba(37,99,235,0.5)] scale-110' 
                  : 'bg-white/10 border-white/10 text-gray-300 hover:bg-white/20'
                }`}
              >
                {i + 1}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}