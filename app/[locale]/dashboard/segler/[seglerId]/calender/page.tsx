'use client';

import { useEffect, useState, useMemo } from "react";
import { useParams } from "next/navigation";
import { ArrowLeft, ChevronLeft, ChevronRight } from "lucide-react";
import dayjs from "dayjs";
import 'dayjs/locale/de';
import 'dayjs/locale/en'; // Falls du Englisch unterstützt
import { Link, useRouter } from '@/navigation';
import { useTranslations, useLocale } from "next-intl";

export default function SeglerCalendarPage() {
  const t = useTranslations("Calendar");
  const common = useTranslations("Common");
  const locale = useLocale();
  const params = useParams();
  const seglerId = params?.seglerId as string;
  const router = useRouter();

  const [currentDate, setCurrentDate] = useState(dayjs().locale(locale));
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Sprache für Dayjs synchronisieren
  useEffect(() => {
    dayjs.locale(locale);
    setCurrentDate(prev => prev.locale(locale));
  }, [locale]);

  async function loadCalendarData() {
    try {
      setLoading(true);
      const [resEvents, resInfo] = await Promise.all([
        fetch('/api/events'),
        fetch(`/api/segler/calendar-info?seglerId=${seglerId}`)
      ]);

      if (!resEvents.ok || !resInfo.ok) throw new Error("Fehler beim Laden");

      const allEvents = await resEvents.json(); 
      const { friends, invitations } = await resInfo.json();

      if (Array.isArray(allEvents)) {
        const processed = allEvents.map(event => {
          let status = 'neutral';
          const istAngemeldet = event.segler && Object.values(event.segler).some((liste: any) => 
            liste.some((anm: any) => String(anm.skipper?.seglerId) === String(seglerId))
          );

          const istEingeladen = invitations?.some((inv: any) => {
            const targetId = inv.eventId || inv.eventID || inv.regattaId;
            return String(targetId) === String(event.id);
          });

          const freundeDabei = event.segler && Object.values(event.segler).some((liste: any) => 
            liste.some((anm: any) => friends.includes(anm.skipper?.seglerId))
          );

          if (istAngemeldet) status = 'angemeldet';
          else if (istEingeladen) status = 'eingeladen';
          else if (freundeDabei) status = 'freunde';

          return { ...event, status };
        }).filter(event => event.status !== 'neutral');

        setEvents(processed);
      }
    } catch (err) {
      console.error("Kalender-Fehler:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (seglerId) loadCalendarData();
  }, [seglerId]);

  const tableRows = useMemo(() => {
    const startOfMonth = currentDate.startOf('month');
    // Startet immer beim Montag der ersten Woche
    let day = startOfMonth.startOf('week').add(locale === 'de' ? 1 : 0, 'day'); 
    
    const rows = [];
    for (let i = 0; i < 6; i++) {
      const row = [];
      for (let j = 0; j < 7; j++) {
        row.push({
          date: day.startOf('day'),
          isCurrentMonth: day.month() === currentDate.month(),
          isToday: day.isSame(dayjs(), 'day')
        });
        day = day.add(1, 'day');
      }
      rows.push(row);
    }
    return rows;
  }, [currentDate, locale]);

  const getEventsForDay = (cellDate: dayjs.Dayjs) => {
    return events.filter(e => {
      const start = dayjs(e.datumVon).startOf('day');
      const end = dayjs(e.datumBis).startOf('day');
      return (cellDate.isSame(start, 'day') || cellDate.isSame(end, 'day') || (cellDate.isAfter(start) && cellDate.isBefore(end)));
    });
  };

  if (loading) return (
    <div className="h-screen bg-[#1e3a8a] flex items-center justify-center text-white font-black italic">
      {t('loading')}
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0f172a]/90 md:rounded-[2.5rem] text-slate-200 pb-20 font-sans">
      <div className="h-screen flex flex-col bg-[#1e3a8a] text-white font-sans overflow-hidden">
        
        {/* NAVBAR */}
        <nav className="h-16 bg-[#1e3a8a] flex items-center justify-between px-8 border-b-2 border-blue-400/20">
          <div className="flex items-center gap-8">
            <button onClick={() => router.back()} className="text-[10px] font-black uppercase tracking-widest text-blue-300">
              <ArrowLeft className="w-5 h-5 inline mr-2" /> {common('back')}
            </button>
            <h1 className="text-2xl font-black italic uppercase tracking-tighter">Regatta <span className="text-blue-400">Pro</span></h1>
          </div>
          <div className="flex items-center bg-blue-950 border border-blue-400/30">
            <button onClick={() => setCurrentDate(currentDate.subtract(1, 'month'))} className="p-2 hover:bg-blue-400/20"><ChevronLeft /></button>
            <span className="px-6 text-sm font-black uppercase italic w-44 text-center">
                {currentDate.format('MMMM YYYY')}
            </span>
            <button onClick={() => setCurrentDate(currentDate.add(1, 'month'))} className="p-2 hover:bg-blue-400/20"><ChevronRight /></button>
          </div>
        </nav>

        {/* KALENDER-TABELLE */}
        <main className="flex-1 p-4 bg-[#1e3a8a] overflow-hidden">
          <table className="w-full h-full table-fixed border-collapse">
            <thead>
              <tr className="bg-blue-900/50">
                {/* Wochentage übersetzt */}
                {['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'].map(dayKey => (
                  <th key={dayKey} className="w-[14.28%] py-3 text-[12px] font-black text-blue-200 uppercase border border-blue-400/40">
                    {t(`days.${dayKey}`)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {tableRows.map((row, rowIndex) => (
                <tr key={rowIndex} className="h-[16.6%]">
                  {row.map((day, dayIndex) => {
                    const dayEvents = getEventsForDay(day.date);
                    return (
                      <td 
                        key={dayIndex} 
                        className={`border border-blue-400/40 p-0 align-top ${!day.isCurrentMonth ? 'bg-blue-950/60 opacity-50' : 'bg-blue-900/20'} ${day.isToday ? 'ring-2 ring-inset ring-blue-400 z-10' : ''}`}
                        style={{ height: '1px' }} 
                      >
                        <div className="grid grid-rows-[auto_1fr] h-full w-full max-h-full overflow-hidden">
                          <div className={`px-3 py-1 flex justify-end border-b border-blue-400/20 flex-none ${day.isToday ? 'bg-blue-600' : 'bg-blue-950/40'}`}>
                            <span className="text-[12px] font-black italic text-white">{day.date.date()}</span>
                          </div>
                          
                          <div className="min-h-0 h-full overflow-y-auto overflow-x-hidden custom-scrollbar p-1 flex flex-col gap-1">
                            {dayEvents.map((e, i) => (
                              <div 
                                key={i}
                                onClick={() => router.push(`/dashboard/segler/${seglerId}/regatta/${e.id}`)}
                                style={{ 
                                  backgroundColor: e.status === 'angemeldet' ? '#369929' : e.status === 'eingeladen' ? '#6f86eb' : '#6d0077', 
                                  borderLeftColor: '#ffffff',
                                  borderLeftWidth: '4px',
                                  borderLeftStyle: 'solid'
                                }}
                                className={`flex-none block px-1.5 py-2 text-[9px] font-black uppercase italic cursor-pointer transition-all hover:translate-x-1 w-full min-w-0 overflow-hidden whitespace-nowrap truncate ${e.status === 'eingeladen' ? 'animate-pulse' : ''}`}
                                title={e.name}
                              >
                                {e.name.length > 10 ? e.name.substring(0, 10) + ".." : e.name}
                              </div>
                            ))}
                          </div>
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </main>

        {/* Legende */}
        <div className="flex gap-4 p-4 justify-center text-[10px] font-black uppercase">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3" style={{ backgroundColor: '#369929' }}></div> {t('legend.myEvents')}
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 animate-pulse" style={{ backgroundColor: '#6f86eb' }}></div> {t('legend.invitations')}
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3" style={{ backgroundColor: '#6d0077' }}></div> {t('legend.friends')}
          </div>
        </div>
      </div>
    </div>
  );
}