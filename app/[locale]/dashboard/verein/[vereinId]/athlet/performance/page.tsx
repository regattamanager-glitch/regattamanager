'use client';

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { 
  Trophy, Users, Anchor, Search, 
  TrendingUp, ArrowLeft, Medal, Clock, Target
} from "lucide-react";
import dayjs from "dayjs";
import 'dayjs/locale/de';
import 'dayjs/locale/en';
import { useRouter } from "next/navigation";
import { useTranslations, useLocale } from 'next-intl';

export default function VereinAthletPerformancePage() {
  // i18n Hooks
  const t = useTranslations('ClubPerformance');
  const locale = useLocale();
  
  const params = useParams();
  const vereinId = params?.vereinId as string;
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [performanceData, setPerformanceData] = useState<any[]>([]);
  const [stats, setStats] = useState({ podiums: 0, totalStarts: 0, activeAthletes: 0, wins: 0 });

  // Dayjs Sprache synchronisieren
  useEffect(() => {
    dayjs.locale(locale);
  }, [locale]);

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

  async function loadPerformanceData() {
    try {
      setLoading(true);
      const [resResults, resEvents, resAccounts] = await Promise.all([
        fetch('/api/events/results'),
        fetch('/api/events'),
        fetch('/api/accounts')
      ]);

      const allResultsObj = await resResults.json(); 
      const allEvents = await resEvents.json();     
      const allAccounts = await resAccounts.json();

      const clubMembers = allAccounts.filter((acc: any) => {
        const memberOf = acc.vereine || acc.vereinId || [];
        return Array.isArray(memberOf) 
          ? memberOf.some(id => String(id).toLowerCase() === vereinId.toLowerCase())
          : String(memberOf).toLowerCase() === vereinId.toLowerCase();
      });

      const memberIds = clubMembers.map((m: any) => String(m.id).trim());
      const processed: any[] = [];

      allEvents.forEach((event: any) => {
        if (!event.segler) return;

        Object.entries(event.segler).forEach(([klasse, participants]: [string, any]) => {
          const partArray = participants as any[];
          
          const clubParticipantsInClass = partArray.filter(p => {
            const sId = String(p.skipper?.seglerId || p.seglerId || "").trim();
            return memberIds.includes(sId);
          });

          if (clubParticipantsInClass.length > 0) {
            const eventResultsInClass = allResultsObj[event.id]?.[klasse];

            clubParticipantsInClass.forEach(memberEntry => {
              const currentId = String(memberEntry.skipper?.seglerId || memberEntry.seglerId || "").trim();
              const athlete = clubMembers.find((m: any) => String(m.id).trim() === currentId);
            
              let rank: number | string = t('statusRegistered');
              let status = t('statusUpcoming');
            
              if (eventResultsInClass) {
                const calculatedRank = calculatePlacement(partArray, eventResultsInClass, currentId);
                if (calculatedRank !== null) {
                  rank = calculatedRank;
                  status = t('statusFinished');
                }
              }
            
              const fullName = athlete 
                ? `${athlete.vorname} ${athlete.nachname}`.trim() 
                : `ID: ${currentId}`;
            
              processed.push({
                athleteId: currentId,
                athleteName: fullName,
                athleteImage: athlete?.profilbild || null, 
                eventName: event.name || event.titel,
                eventId: event.id,
                datum: event.datumVon,
                location: event.location,
                klasse,
                rank,
                totalParticipants: partArray.length,
                status
              });
            });
          }
        });
      });

      const sorted = processed.sort((a, b) => dayjs(b.datum).diff(dayjs(a.datum)));
      
      setStats({
        totalStarts: sorted.length,
        podiums: sorted.filter(r => typeof r.rank === 'number' && r.rank <= 3).length,
        wins: sorted.filter(r => r.rank === 1).length,
        activeAthletes: new Set(sorted.map(r => r.athleteId)).size
      });
      
      setPerformanceData(sorted);
    } catch (err) {
      console.error("Fehler:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (vereinId) loadPerformanceData();
  }, [vereinId]);

  const filteredResults = performanceData.filter(res => 
    res.athleteName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    res.eventName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return (
    <div className="min-h-screen bg-[#0f172a]/90 md:rounded-[2.5rem] flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-sky-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-sky-500 font-black uppercase tracking-[0.2em] text-[10px]">{t('loading')}</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0f172a]/90 md:rounded-[2.5rem] text-slate-100 p-6 md:p-12 font-sans">
      <header className="max-w-7xl mx-auto mb-12">
        <button onClick={() => router.back()} className="flex items-center gap-2 text-[10px] font-black uppercase text-slate-500 hover:text-sky-400 transition-all mb-8">
          <ArrowLeft size={14} /> {t('back')}
        </button>

        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8">
          <div>
            <div className="flex items-center gap-2 text-sky-400 mb-3 font-black uppercase tracking-[0.3em] text-[10px]">
              <TrendingUp size={18} /> {t('subtitle')}
            </div>
            <h1 className="text-6xl font-black text-white italic uppercase tracking-tighter leading-none">
              {t('titleMain')} <span className="text-sky-500">{t('titleHighlight')}</span>
            </h1>
          </div>

          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-sky-400" />
            <input 
              type="text"
              placeholder={t('searchPlaceholder')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-slate-900/50 border border-white/10 rounded-2xl py-4 pl-12 pr-8 text-xs font-black uppercase tracking-widest focus:border-sky-500 outline-none w-full lg:w-96 transition-all"
            />
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
          {[
            { label: t('statStarts'), value: stats.totalStarts, icon: Target, color: 'text-sky-400' },
            { label: t('statPodiums'), value: stats.podiums, icon: Medal, color: 'text-emerald-400' },
            { label: t('statWins'), value: stats.wins, icon: Trophy, color: 'text-amber-400' },
            { label: t('statSailors'), value: stats.activeAthletes, icon: Users, color: 'text-purple-400' }
          ].map((s, i) => (
            <div key={i} className="bg-white/5 border border-white/10 rounded-3xl p-6 backdrop-blur-sm">
              <s.icon className={`w-5 h-5 mb-2 ${s.color}`} />
              <div className="text-3xl font-black text-white">{s.value}</div>
              <div className="text-[10px] uppercase tracking-widest font-bold text-slate-500">{s.label}</div>
            </div>
          ))}
        </div>

        <div className="bg-white/5 border border-white/10 rounded-[2.5rem] overflow-hidden backdrop-blur-sm">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white/5 text-[10px] font-bold uppercase tracking-widest text-slate-500">
                <th className="p-8">{t('tableAthlete')}</th>
                <th className="p-8">{t('tableRegatta')}</th>
                <th className="p-8 text-right">{t('tableResult')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredResults.map((res, i) => {
                const rankNum = Number(res.rank);
                const isPodium = typeof res.rank === 'number' && rankNum <= 3;
                
                const rankColor = 
                  rankNum === 1 ? 'text-amber-400 shadow-amber-400/20' : 
                  rankNum === 2 ? 'text-slate-300 shadow-slate-300/20' : 
                  rankNum === 3 ? 'text-orange-500 shadow-orange-500/20' : 
                  'text-white';

                return (
                  <tr key={i} className="hover:bg-white/[0.03] transition-all group">
                    <td className="p-8">
                      <div className="flex items-center gap-4">
                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-black border uppercase italic text-sm overflow-hidden shrink-0 ${isPodium ? 'border-white/20' : 'bg-sky-500/10 border-sky-500/20 text-sky-400'}`}>
                          {res.athleteImage ? (
                            <img 
                              src={res.athleteImage} 
                              alt={res.athleteName} 
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = ""; 
                                (e.target as HTMLImageElement).style.display = 'none';
                              }}
                            />
                          ) : (
                            <span>{res.athleteName.split(' ').map((n: string) => n[0]).join('').substring(0, 2)}</span>
                          )}
                        </div>
                        <div>
                          <p className="text-white font-black italic uppercase text-lg tracking-tight leading-tight">{res.athleteName}</p>
                          <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mt-1">{res.status}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-8">
                      <p className="text-slate-200 font-bold uppercase text-sm mb-1 line-clamp-1">{res.eventName}</p>
                      <div className="flex items-center gap-4 text-[9px] font-bold text-slate-500 uppercase">
                        <span className="flex items-center gap-1"><Clock size={10} /> {dayjs(res.datum).format('DD.MM.YYYY')}</span>
                        <span className="flex items-center gap-1"><Anchor size={10} /> {res.klasse}</span>
                      </div>
                    </td>
                    <td className="p-8 text-right">
                      <div className="flex flex-col items-end">
                        <div className="flex items-center gap-2">
                          <span className={`text-4xl font-black italic transition-all ${rankColor}`}>
                            {typeof res.rank === 'number' ? `${res.rank}.` : res.rank}
                          </span>
                          {typeof res.rank === 'number' && (
                            <span className="text-[10px] font-bold text-slate-600 uppercase">/ {res.totalParticipants}</span>
                          )}
                        </div>
                        {rankNum === 1 && <span className="text-[8px] font-black text-amber-400 uppercase tracking-[0.2em] mt-1 italic">{t('labelWinner')}</span>}
                        {rankNum === 2 && <span className="text-[8px] font-black text-slate-300 uppercase tracking-[0.2em] mt-1 italic">{t('labelRunnerUp')}</span>}
                        {rankNum === 3 && <span className="text-[8px] font-black text-orange-500 uppercase tracking-[0.2em] mt-1 italic">{t('labelThird')}</span>}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {filteredResults.length === 0 && (
            <div className="p-20 text-center text-slate-600 font-bold uppercase tracking-widest text-xs">
              {t('noData')}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}