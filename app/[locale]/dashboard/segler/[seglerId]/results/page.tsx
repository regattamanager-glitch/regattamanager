'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import dayjs from "dayjs";
import 'dayjs/locale/de';
import 'dayjs/locale/en'; // Englisch hinzugefügt
import 'dayjs/locale/fr'; // Falls benötigt
import { 
  Trophy, 
  ChevronLeft, 
  MapPin, 
  Calendar,
  ArrowRight,
  Loader2,
  Medal,
  Target,
  Anchor
} from 'lucide-react';
import { useTranslations, useLocale } from 'next-intl';

type ResultEntry = {
  eventId: string;
  eventName: string;
  datum: string;
  location: string;
  klasse: string;
  rank: number;
  totalParticipants: number;
};
 
export default function SeglerResultsPage() {
  const t = useTranslations('Results');
  const locale = useLocale();
  const router = useRouter();
  const params = useParams();
  const seglerId = params.seglerId as string;
  
  const [results, setResults] = useState<ResultEntry[]>([]);
  const [loading, setLoading] = useState(true);

  // Dayjs Sprache synchronisieren
  useEffect(() => {
    dayjs.locale(locale);
  }, [locale]);

  useEffect(() => {
    const loadData = async () => {
      try {
        const sessionRes = await fetch('/api/accounts/session');
        const userData = await sessionRes.json();
        const [eventsRes, resultsRes] = await Promise.all([
          fetch('/api/events'),
          fetch('/api/events/results')
        ]);
        
        const allEvents = await eventsRes.json();
        const allResults = await resultsRes.json();
        const myId = String(userData.id).trim();
        const processed: ResultEntry[] = [];

        allEvents.forEach((event: any) => {
          if (!event.segler) return;
          Object.entries(event.segler).forEach(([klasse, participants]: [string, any]) => {
            const partArray = participants as any[];
            const isMe = partArray.some((p: any) => String(p.skipper?.seglerId || p.seglerId || "").trim() === myId);
            
            if (isMe) {
              const resObj = allResults[event.id]?.[klasse];
              if (resObj) {
                const rank = calculatePlacement(partArray, resObj, myId);
                if (rank !== null) {
                  processed.push({
                    eventId: event.id, 
                    eventName: event.name, 
                    datum: event.datumVon,
                    location: event.location, 
                    klasse, 
                    rank, 
                    totalParticipants: partArray.length
                  });
                }
              }
            }
          });
        });
        setResults(processed.sort((a, b) => dayjs(b.datum).diff(dayjs(a.datum))));
      } catch (err) { 
        console.error(err); 
      } finally { 
        setLoading(false); 
      }
    };
    loadData();
  }, [seglerId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0f172a] flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-sky-400 animate-spin" />
      </div>
    );
  }

  const stats = {
    total: results.length,
    podiums: results.filter(r => r.rank <= 3).length,
    wins: results.filter(r => r.rank === 1).length
  };

  return (
    <div className="min-h-screen bg-[#0f172a]/90 md:rounded-[2.5rem] text-slate-100 pb-20 font-sans">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] right-[-5%] w-[50%] h-[50%] bg-sky-500/10 blur-[120px] rounded-full" />
      </div>

      <header className="sticky top-0 z-50 md:rounded-[2.5rem] border-b border-white/5 bg-[#0f172a]/80 backdrop-blur-xl">
        <div className="max-w-5xl mx-auto px-6 h-20 flex items-center justify-between">
          <button onClick={() => router.back()} className="group flex items-center gap-2 text-slate-400 hover:text-sky-400 transition-all uppercase text-[10px] font-bold tracking-[0.2em]">
            <div className="p-2 rounded-full group-hover:bg-sky-500/10 transition-colors">
              <ChevronLeft className="w-4 h-4" />
            </div>
            {t('back')}
          </button>
          <h1 className="text-xl font-black italic uppercase tracking-tighter flex items-center gap-3">
            <div className="p-2 bg-sky-500/20 rounded-full">
              <Anchor className="w-5 h-5 text-sky-400" />
            </div>
            {t('headerMain')} <span className="text-sky-400">{t('headerHighlight')}</span>
          </h1>
          <div className="w-20 hidden md:block" />
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 pt-10">
        
        {/* Stats Section */}
        <div className="grid grid-cols-3 gap-6 mb-12">
          {[
            { label: t('statRegattas'), value: stats.total, icon: Target, color: 'text-sky-400' },
            { label: t('statPodiums'), value: stats.podiums, icon: Medal, color: 'text-emerald-400' },
            { label: t('statWins'), value: stats.wins, icon: Trophy, color: 'text-amber-400' }
          ].map((stat, i) => (
            <div key={i} className="bg-white/5 border border-white/10 rounded-[2rem] p-6 text-center backdrop-blur-sm">
              <stat.icon className={`w-5 h-5 mx-auto mb-2 ${stat.color}`} />
              <div className="text-3xl font-black text-white">{stat.value}</div>
              <div className="text-[10px] uppercase tracking-widest font-bold text-slate-500">{stat.label}</div>
            </div>
          ))}
        </div>

        <div className="space-y-4">
          {results.length === 0 ? (
            <div className="text-center py-20 bg-white/5 rounded-[2rem] border border-dashed border-white/10">
               <p className="text-slate-500 uppercase text-xs font-bold tracking-widest">{t('noResults')}</p>
            </div>
          ) : (
            results.map((res, idx) => {
              const rankStyles = 
                res.rank === 1 ? 'bg-amber-400 text-[#78350f] border-amber-200 shadow-[0_0_20px_rgba(251,191,36,0.3)]' :
                res.rank === 2 ? 'bg-slate-200 text-[#334155] border-white shadow-[0_0_20px_rgba(226,232,240,0.2)]' :
                res.rank === 3 ? 'bg-orange-600 text-orange-50 border-orange-400 shadow-[0_0_20px_rgba(234,88,12,0.2)]' :
                'bg-slate-800 text-slate-400 border-slate-700';

              return (
                <div 
                  key={`${res.eventId}-${idx}`}
                  className="group relative bg-white/5 border border-white/10 rounded-full p-3 pr-6 flex items-center justify-between transition-all hover:bg-white/[0.08] hover:translate-y-[-2px]"
                >
                  <div className="flex items-center gap-6">
                    <div className={`h-14 w-14 rounded-full flex flex-col items-center justify-center font-black border-2 shrink-0 ${rankStyles}`}>
                      <span className="text-xl leading-none">{res.rank}.</span>
                      <span className="text-[8px] uppercase tracking-tighter">{t('rankLabel')}</span>
                    </div>

                    <div className="flex flex-col">
                      <div className="flex items-center gap-3 mb-0.5">
                        <span className="text-sky-400 text-[10px] font-black uppercase tracking-widest">
                          {res.klasse}
                        </span>
                        <span className="text-slate-600 text-xs hidden sm:inline">•</span>
                        <span className="text-slate-500 text-xs font-medium flex items-center gap-1">
                          <Calendar className="w-3 h-3" /> {dayjs(res.datum).format('MMM YYYY')}
                        </span>
                      </div>
                      <h3 className="font-bold text-white group-hover:text-sky-400 transition-colors tracking-tight text-lg">
                        {res.eventName}
                      </h3>
                    </div>
                  </div>

                  <div className="flex items-center gap-8">
                    <div className="hidden md:flex flex-col items-end">
                      <div className="flex items-center gap-1.5 text-slate-400">
                        <MapPin className="w-3 h-3 text-sky-500" />
                        <span className="text-xs font-medium italic">{res.location}</span>
                      </div>
                      <p className="text-[9px] font-bold text-slate-600 uppercase tracking-widest mt-1">
                        {res.totalParticipants} {t('participantsLabel')}
                      </p>
                    </div>
                    
                    <button 
                      onClick={() => router.push(`/regatta/${res.eventId}`)}
                      className="h-12 w-12 bg-sky-500/10 group-hover:bg-sky-500 text-sky-400 group-hover:text-white rounded-full flex items-center justify-center transition-all shadow-lg"
                    >
                      <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </main>
    </div>
  );
}
// Hilfsfunktion (exakt wie im Original)
function calculatePlacement(seglerList: any[], eventResults: Record<string, any[]>, targetId: string) {
  const numParticipants = seglerList.length;
  if (numParticipants === 0) return null;
  const targetIdStr = String(targetId).trim();

  const scoredSegler = seglerList.map(entry => {
    const sId = String(entry.skipper?.seglerId || entry.seglerId || "").trim();
    const scoresRaw = eventResults[sId] || [];
    const numericScores = scoresRaw.map(s => {
      const n = parseFloat(s);
      return !isNaN(n) ? n : numParticipants + 1; 
    });

    let discardIndex = -1;
    if (numericScores.length >= 4) {
      const maxVal = Math.max(...numericScores);
      discardIndex = numericScores.indexOf(maxVal);
    }

    const totalPoints = numericScores.reduce((sum, val, idx) => 
      idx === discardIndex ? sum : sum + val, 0
    );

    const tieBreakScores = numericScores
      .filter((_, idx) => idx !== discardIndex)
      .sort((a, b) => a - b);

    return { sId, totalPoints, tieBreakScores };
  });

  const sorted = [...scoredSegler].sort((a, b) => {
    if (a.totalPoints !== b.totalPoints) return a.totalPoints - b.totalPoints;
    for (let i = 0; i < a.tieBreakScores.length; i++) {
      const scoreA = a.tieBreakScores[i] || 0;
      const scoreB = b.tieBreakScores[i] || 0;
      if (scoreA !== scoreB) return scoreA - scoreB;
    }
    return 0;
  });

  const rank = sorted.findIndex(s => s.sId === targetIdStr) + 1;
  return rank > 0 ? rank : null;
}