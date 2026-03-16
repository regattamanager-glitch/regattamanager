'use client';

import { Link } from "@/navigation";
import { useState, useEffect, useRef } from "react";
import { useTranslations } from "next-intl";

interface Account { id: string | number; name?: string; kuerzel?: string; username?: string; verein?: string; }
interface Regatta { 
  id: string; name: string; datumVon: string; location: string; verein?: string; 
  platz1?: string; platz2?: string; platz3?: string; privat: boolean;
}

export default function HomePage() {
  const t = useTranslations();
  const [upcomingRegatten, setUpcomingRegatten] = useState<Regatta[]>([]);
  const [pastRegatten, setPastRegatten] = useState<Regatta[]>([]);
  const [loading, setLoading] = useState(true);

  // --- Dynamic Color Sliding Bubble Logik ---
  const panelRef = useRef<HTMLDivElement>(null);
  const bubbleRef = useRef<HTMLDivElement>(null);
  
  const [bubbleStyle, setBubbleStyle] = useState({
    left: 0,
    width: 0,
    opacity: 0,
    color: 'bg-slate-700',
    borderColor: 'border-slate-500/50',
    shadow: 'shadow-white/5'
  });

  const handleMouseEnterButton = (e: React.MouseEvent<HTMLAnchorElement>, type: 'regatten' | 'login' | 'register') => {
    if (!panelRef.current || !bubbleRef.current) return;

    const panelRect = panelRef.current.getBoundingClientRect();
    const buttonRect = e.currentTarget.getBoundingClientRect();

    const relativeLeft = buttonRect.left - panelRect.left;
    const buttonWidth = buttonRect.width;

    let color = 'bg-slate-700'; 
    let borderColor = 'border-slate-500/50';
    let shadow = 'shadow-[0_0_20px_rgba(255,255,255,0.05)]';

    if (type === 'login') {
      color = 'bg-blue-600';
      borderColor = 'border-blue-400/50';
      shadow = 'shadow-[0_0_30px_rgba(37,99,235,0.4)]';
    } else if (type === 'register') {
      color = 'bg-emerald-600';
      borderColor = 'border-emerald-400/50';
      shadow = 'shadow-[0_0_30px_rgba(16,185,129,0.4)]';
    }

    setBubbleStyle({
      left: relativeLeft,
      width: buttonWidth,
      opacity: 1,
      color,
      borderColor,
      shadow
    });
  };

  const handleMouseLeavePanel = () => {
    setBubbleStyle(prev => ({ ...prev, opacity: 0 }));
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [eventsRes, accountsRes] = await Promise.all([
          fetch("/api/events"),
          fetch("/api/accounts")
        ]);
        const events = await eventsRes.json();
        const accounts: Account[] = await accountsRes.json();
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const mappedEvents = events
          .filter((event: any) => event.privat !== true && event.datumVon)
          .map((event: any) => {
            const vID = event.verein_id || event.vereinId; 
            const foundAccount = accounts.find((acc: any) => String(acc.id || acc._id) === String(vID));
            return {
              ...event,
              verein: foundAccount ? (foundAccount.name || foundAccount.username || foundAccount.verein) : "—",
            };
          });

        setUpcomingRegatten(mappedEvents.filter((e: any) => new Date(e.datumVon.split('.').reverse().join('-')) >= today).slice(0, 3));
        setPastRegatten(mappedEvents.filter((e: any) => new Date(e.datumVon.split('.').reverse().join('-')) < today).slice(0, 3));
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return <p className="text-white p-6">{t('Common.loading')}</p>;

  return (
    <div className="max-w-6xl mx-auto px-6 py-12 relative z-10">
      {/* Hero Sektion */}
      <section className="text-center mb-24 relative pt-16 animate-in fade-in slide-in-from-top-4 duration-1000">
        <h1 className="text-5xl md:text-8xl font-black mb-6 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-teal-400 drop-shadow-2xl tracking-tight cursor-default">
          {t('Common.title').toUpperCase()}
        </h1>
        <p className="text-gray-200 text-lg md:text-xl mb-16 max-w-2xl mx-auto opacity-80 font-light tracking-wide uppercase italic">
          {t('Home.subtitle')}
        </p>

        {/* DAS PANEL: Starr und stabil */}
        <div 
          ref={panelRef}
          onMouseLeave={handleMouseLeavePanel}
          className="relative inline-flex items-center border border-white/10 bg-black/50 backdrop-blur-2xl rounded-[3rem] p-1.5 mx-auto shadow-2xl group/panel overflow-hidden"
        >
          {/* 🌊 DIE BLASE: Reagiert auf 'active' durch Skalierung */}
          <div 
            ref={bubbleRef}
            className={`absolute top-1.5 bottom-1.5 rounded-full z-0 transition-all duration-300 ease-out border 
              ${bubbleStyle.color} ${bubbleStyle.borderColor} ${bubbleStyle.shadow}
              group-active/panel:scale-95 group-active/panel:brightness-125`}
            style={{ 
              left: `${bubbleStyle.left}px`, 
              width: `${bubbleStyle.width}px`, 
              opacity: bubbleStyle.opacity 
            }}
          />

          {/* Button 1 */}
          <Link 
            href="/regatten" 
            className="group/btn relative z-10 active:scale-95 transition-all duration-75"
            onMouseEnter={(e) => handleMouseEnterButton(e, 'regatten')}
          >
            <div className="w-[140px] h-[52px] flex items-center justify-center transition-all">
              <span className="text-white font-bold tracking-wide transition-all group-hover/btn:scale-110 group-hover/btn:font-black group-active/btn:text-blue-200">
                {t('Navigation.regattas')}
              </span>
            </div>
          </Link>

          <div className="w-[1px] h-6 bg-white/10 relative z-10 transition-opacity duration-300 group-hover/panel:opacity-0" />

          {/* Button 2 */}
          <Link 
            href="/login" 
            className="group/btn relative z-10 active:scale-95 transition-all duration-75"
            onMouseEnter={(e) => handleMouseEnterButton(e, 'login')}
          >
            <div className="w-[140px] h-[52px] flex items-center justify-center transition-all">
              <span className="text-white font-bold tracking-wide transition-all group-hover/btn:scale-110 group-hover/btn:font-black group-active/btn:font-blue-600">
                {t('Navigation.login')}
              </span>
            </div>
          </Link>

          <div className="w-[1px] h-6 bg-white/10 relative z-10 transition-opacity duration-300 group-hover/panel:opacity-0" />

          {/* Button 3 */}
          <Link 
            href="/register" 
            className="group/btn relative z-10 active:scale-95 transition-all duration-75"
            onMouseEnter={(e) => handleMouseEnterButton(e, 'register')}
          >
            <div className="w-[160px] h-[52px] flex items-center justify-center transition-all">
              <span className="text-white font-bold tracking-wide transition-all group-hover/btn:scale-110 group-hover/btn:font-black group-active/btn:text-emerald-100">
                {t('Auth.registerTitle')}
              </span>
            </div>
          </Link>
        </div>
      </section>

      {/* Regatten Sektionen */}
      <section className="mb-20">
        <h2 className="text-3xl font-bold mb-10 text-white flex items-center gap-4">
          <span className="w-2 h-10 bg-blue-500 rounded-full shadow-[0_0_15px_rgba(59,130,246,0.6)]"></span>
          {t('Regatta.listTitle')}
        </h2>
        <div className="grid grid-cols-1 gap-8">
          {upcomingRegatten.length > 0 ? (
            upcomingRegatten.map(r => <RegattaCard key={r.id} regatta={r} t={t} />)
          ) : (
            <p className="text-gray-400 italic backdrop-blur-sm bg-black/20 p-4 rounded-xl inline-block">
              {t('Regatta.noPublic')}
            </p>
          )}
        </div>
      </section>

      <section className="pb-20">
        <h2 className="text-3xl font-bold mb-10 text-white flex items-center gap-4 text-gray-400">
          <span className="w-2 h-10 bg-gray-600 rounded-full"></span>
          {t('Regatta.results')}
        </h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch">
          {pastRegatten.map(r => <RegattaCard key={r.id} regatta={r} t={t} isPast />)}
        </div>
      </section>
    </div>
  );
}

function RegattaCard({ regatta, t, isPast }: { regatta: any, t: any, isPast?: boolean }) {
  return (
    <div className="relative group">
      <Link href={`/regatta/${regatta.id}`} className="block no-underline">
        <div className={`
          p-8 rounded-[2.5rem] transition-all duration-300 border backdrop-blur-md
          group-hover:scale-[1.01] group-hover:shadow-[0_20px_50px_rgba(0,0,0,0.5)]
          ${isPast 
            ? 'bg-black/60 border-white/10 group-hover:bg-black/80 group-hover:border-white/20' 
            : 'bg-gray-900/80 border-white/20 shadow-2xl group-hover:border-blue-500/50 group-hover:bg-gray-900/90'
          }
        `}>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
            <div className="flex-1 w-full">
              <span className={`text-[11px] font-black px-4 py-1.5 rounded-full uppercase tracking-widest mb-4 inline-block transition-all duration-300 ${
                isPast 
                  ? 'bg-white/10 text-gray-400 group-hover:bg-white/20 group-hover:text-white' 
                  : 'bg-blue-600 text-white shadow-lg shadow-blue-900/40 group-hover:bg-blue-500 group-hover:scale-105'
              }`}>
                {isPast ? t('Common.finish') : t('Regatta.status')}
              </span>
              <h3 className="text-3xl font-bold text-white mb-2 transition-colors duration-300 group-hover:text-blue-400">
                {regatta.name}
              </h3>
              <div className="flex flex-wrap items-center gap-x-4 text-gray-300 font-medium mb-4">
                <p>📅 {regatta.datumVon}</p>
                <p>📍 {regatta.location}</p>
              </div>
              <p className="text-[11px] text-blue-400 font-black uppercase tracking-widest">
                {t('Regatta.organizer')}: <span className="text-white/80">{regatta.verein}</span>
              </p>
              {isPast && (regatta.platz1 || regatta.platz2) && (
                <div className="mt-8 grid grid-cols-3 gap-4 p-5 bg-white/5 rounded-3xl border border-white/5 transition-colors group-hover:bg-white/10">
                  {[1, 2, 3].map(pos => (
                    <div key={pos} className="text-center">
                      <p className={`text-[10px] font-black uppercase mb-1 ${pos === 1 ? 'text-yellow-500' : pos === 2 ? 'text-gray-400' : 'text-orange-400'}`}>
                        {pos}. {t('Results.rankLabel')}
                      </p>
                      <p className="text-sm font-bold text-white truncate">{pos === 1 ? regatta.platz1 : pos === 2 ? regatta.platz2 : regatta.platz3 || '—'}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className={`
              w-full md:w-48 py-4 rounded-2xl font-black text-sm text-center transition-all duration-300
              group-hover:scale-105 group-active:scale-95
              ${isPast 
                ? 'bg-white/5 text-white border border-white/10 group-hover:bg-white/20 group-hover:border-white/40' 
                : 'bg-blue-600 text-white shadow-lg group-hover:bg-blue-500 group-hover:shadow-blue-500/50 group-active:!bg-emerald-500 group-active:!border-emerald-500 active:shadow-emerald-500/50'
              }
            `}>
              {t('Regatta.details')}
            </div>
          </div>
        </div>
      </Link>
    </div>
  );
}