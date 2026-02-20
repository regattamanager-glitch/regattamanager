'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import dayjs from "dayjs";
import { Calendar, MapPin, User as UserIcon, LogOut, Menu, ChevronRight, Trophy, Users, Copy, Check, Settings, Ship, Anchor, Waves, } from 'lucide-react';
import SailingIcon from '@mui/icons-material/Sailing';
import CelebrationIcon from '@mui/icons-material/Celebration';
import GroupsIcon from '@mui/icons-material/Groups';
import { useTranslations } from "next-intl";


// Types (unverändert, aber erweitert für bessere UX)
type Event = {
  id: string;
  name: string;
  datumVon: string;
  datumBis: string;
  location: string;
  land?: string;
  segler?: Record<string, { skipper: { seglerId: string; name: string } }[]>;
};

export default function SeglerDashboard() {
  const t = useTranslations("Dashboard");
  const common = useTranslations("Common"); // Für globale Begriffe wie "Details" oder "Ahoi"
  const router = useRouter();
  const params = useParams();

  // 1. Zuerst die States deklarieren
  const [account, setAccount] = useState<any | null>(null);
  const [events, setEvents] = useState<Event[]>([]);
  const [menuOpen, setMenuOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [podiums, setPodiums] = useState(0);
  const [activeClasses, setActiveClasses] = useState<Set<string>>(new Set());
  const [copied, setCopied] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [notifMenuOpen, setNotifMenuOpen] = useState(false);

  // 2. Jetzt erst effectiveId berechnen
  const urlId = params?.seglerId as string;
// Wir priorisieren die URL-ID, falls sie nicht "null" oder "undefined" als String ist
const effectiveId = (urlId && urlId !== "undefined" && urlId !== "null") 
  ? urlId 
  : account?.id;

// Eine Hilfsfunktion, die prüft ob wir navigieren dürfen
const getSafeHref = (basePath: string) => {
  if (!effectiveId || effectiveId === "null") return "#"; // Verhindert kaputte Links
  return `/dashboard/segler/${effectiveId}${basePath}`;
};

  // 3. Den Link-Checker einbauen (verhindert den Klick auf kaputte URLs)
  const safePush = (path: string) => {
    if (!effectiveId || effectiveId === "undefined") {
      console.error("Navigation abgebrochen: Keine gültige ID vorhanden.");
      return;
    }
    router.push(path);
  };

const handleInviteAction = async (inviteId: string, action: 'accept' | 'decline') => {
  const res = await fetch('/api/notification/respond', { 
    method: 'POST', 
    body: JSON.stringify({ inviteId, action }) 
  });
  
  const data = await res.json();

  if (data.success) {
    // Falls der Server eine Weiterleitung vorgibt (nur bei Event Accept):
    if (data.redirectTo) {
      window.location.href = data.redirectTo; 
      // Alternativ mit next/navigation: router.push(data.redirectTo)
    } else {
      // Normales UI Update für Freunde/Ablehnungen
      setNotifications(prev => prev.filter(n => n.id !== inviteId));
    }
  }
  
};

  useEffect(() => {
    const loadAccount = async () => {
      try {
        const res = await fetch('/api/accounts/session');
        if (!res.ok) throw new Error();
        const data = await res.json();
        setAccount(data);
      } catch (err) {
        router.push('/login');
      }
    };
    loadAccount();
  }, [router]);

  useEffect(() => {
  if (!account || !effectiveId) return;

  const fetchNotifications = async () => {
  try {
    const res = await fetch('/api/notification');
    const allInvites = await res.json();
    
    // WICHTIG: Hier von 'seglerId' auf 'receiverId' ändern!
    const myNotifs = allInvites.filter((n: any) => 
      String(n.receiverId).trim() === String(effectiveId).trim()
    );
    
    setNotifications(myNotifs);
  } catch (err) {
    console.error("Fehler beim Laden:", err);
  }
};

  fetchNotifications();
}, [account, effectiveId]);

const copyIdToClipboard = () => {
    if (!account?.id) return;
    navigator.clipboard.writeText(account.id);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  useEffect(() => {
  if (!account) return;

  

  const loadData = async () => {
  try {
    const [eventsRes, resultsRes] = await Promise.all([
      fetch('/api/events'),
      fetch('/api/events/results')
    ]);

    const allEvents = await eventsRes.json();
    const allResults = await resultsRes.json(); 

    let podiumCount = 0;
    const tempClasses = new Set<string>();
    const upcoming: Event[] = [];
    const myId = String(account.id).trim();

    allEvents.forEach((event: any) => {
      if (!event.segler) return;

      Object.entries(event.segler).forEach(([klasseName, participants]: [string, any]) => {
        const participantsArray = participants as any[];
        
        const isMe = participantsArray.some((p: any) => {
          const pId = String(p.skipper?.seglerId || p.seglerId || "").trim();
          return pId === myId;
        });

        if (isMe) {
          // Normalisierung für die "2 Klassen" Problematik
          const cleanKlasse = klasseName.trim();
          tempClasses.add(cleanKlasse);

          // Zugriff auf results.json Struktur
          // allResults[eventId] -> { "Optimist": { "ID": [1,2] } }
          const eventClassResults = allResults[event.id]?.[klasseName];
          
          if (eventClassResults) {
            const rank = calculatePlacement(participantsArray, eventClassResults, myId);
            
            // Debugging in der Konsole
            console.log(`Match! Event: ${event.name}, Rang: ${rank}`);
            
            if (rank !== null && rank >= 1 && rank <= 3) {
              podiumCount++;
            }
          }

          const eventDate = dayjs(event.datumVon);
          if (eventDate.isAfter(dayjs().subtract(1, 'day'))) {
            if (!upcoming.find(e => e.id === event.id)) upcoming.push(event);
          }
        }
      });
    });

    setEvents(upcoming);
    setPodiums(podiumCount);
    setActiveClasses(tempClasses);
  } catch (err) {
    console.error("Dashboard Load Error:", err);
  } finally {
    setLoading(false);
  }
};

  loadData();
}, [account]);

  const logout = () => {
    localStorage.removeItem('user');
    router.push('/login');
  };

  return (
    <div className="min-h-screen bg-[#0f172a]/90 md:rounded-[2.5rem] text-slate-200 font-sans pb-12">
      <nav className="sticky top-0 z-50 bg-[#1e293b]/80 backdrop-blur-md rounded-xl border-b border-slate-700">
        <div className="max-w-7xl mx-auto px-6 h-16 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 p-2 rounded-lg">
              <Trophy className="text-white w-5 h-5" />
            </div>
            <span className="font-black tracking-tighter text-xl uppercase italic">
              {common('appName')}
            </span>
          </div>
          {/* ... Navbar Rechts */}

          <div className="flex items-center gap-4">
            <span className="hidden md:block text-sm font-bold text-slate-400">
              {account?.vorname} {account?.nachname}
            </span>
                      {/* ÄNDERUNG: Ein Wrapper-DIV statt des äußeren Buttons */}
            <div className="relative">
              <button 
                onClick={() => setMenuOpen(!menuOpen)}
                className="p-2 hover:bg-slate-700 rounded-full transition-colors"
              >
                <Menu className="w-6 h-6 text-white" />
              </button>
          
              {/* Das Dropdown ist jetzt ein Nachbar des Buttons, kein Kind */}
              {menuOpen && (
  <div className="absolute right-0 mt-4 w-64 bg-[#1e293b] border border-slate-700 rounded-2xl shadow-2xl py-2 overflow-hidden animate-in fade-in slide-in-from-top-2 z-50">
    <MenuLink 
      icon={<SailingIcon />} 
      label={t('menu.events')} 
      href={`/dashboard/segler/${effectiveId}/events`} 
    />
    <MenuLink 
      icon={<Trophy />} 
      label={t('menu.results')} 
      href={`/dashboard/segler/${effectiveId}/results`} 
    />
    <MenuLink 
      icon={<Calendar />} 
      label={t('menu.calendar')} 
      href={`/dashboard/segler/${effectiveId}/calender`} 
    />
    <MenuLink 
      icon={<GroupsIcon />} 
      label={t('menu.club')} 
      href={`/dashboard/segler/${effectiveId}/clubEvents`} 
    />
    <MenuLink 
      icon={<Users />} 
      label={t('menu.friends')} 
      href={`/dashboard/segler/${effectiveId}/friends`} 
    />
    <MenuLink 
      icon={<Settings />} 
      label={t('menu.profile')} 
      href={`/dashboard/segler/${effectiveId}/profil`} 
    />
    
    <hr className="border-slate-700 my-2" />
    
    <button 
      onClick={logout} 
      className="flex items-center gap-3 w-full px-4 py-3 text-red-400 hover:bg-red-500/10 font-bold transition-colors"
    >
      <LogOut className="w-4 h-4" /> 
      {common('logout')}
    </button>
  </div>
)}
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6 pt-10">
        <div className="mb-10">
          <h1 className="text-4xl font-black text-white mb-2 tracking-tight uppercase">
            {common('greeting')}, {account?.vorname}!
          </h1>
          <p className="text-slate-400 font-medium">
            {t('upcomingCount', { count: events.length })}
          </p>
        </div>

        {/* Dashboard Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Main Content: Events */}
          <div className="lg:col-span-2 space-y-6">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-sm font-black uppercase tracking-widest text-blue-500 flex items-center gap-2">
           <Calendar className="w-4 h-4" /> {t('myRegattas')}
        </h2>
            </div>

            {loading ? (
              <div className="h-64 flex items-center justify-center bg-slate-800/20 rounded-3xl border border-slate-800 border-dashed">
                <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : events.length === 0 ? (
              <div className="bg-[#1e293b] p-12 rounded-3xl text-center border border-slate-800">
                <p className="text-slate-500 font-bold mb-4 italic">{t('noEvents')}</p>
        <button onClick={() => router.push(`/dashboard/segler/${effectiveId}/events`)} className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-xl font-black uppercase text-sm transition-all">
          {t('findEventButton')}
        </button>
              </div>
            ) : (
              <div className="grid gap-4">
                {events.map(ev => (
                  <div 
                    key={ev.id}
                    className="group bg-[#1e293b] hover:bg-[#2d3a4f] p-5 rounded-3xl border border-slate-800 transition-all flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
                  >
                    <div className="flex gap-5 items-center">
                      <div className="bg-slate-900 h-16 w-16 rounded-2xl flex flex-col items-center justify-center border border-slate-700">
                        <span className="text-[10px] uppercase font-black text-blue-400">
                          {dayjs(ev.datumVon).format('MMM')}
                        </span>
                        <span className="text-2xl font-black text-white">
                          {dayjs(ev.datumVon).format('DD')}
                        </span>
                      </div>
                      <div>
                        <h3 className="text-lg font-black text-white group-hover:text-blue-400 transition-colors">
                          {ev.name}
                        </h3>
                        <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1 text-sm text-slate-400">
                          <span className="flex items-center gap-1.5"><MapPin className="w-3 h-3" /> {ev.location}</span>
                          <span className="flex items-center gap-1.5"><Calendar className="w-3 h-3" /> {dayjs(ev.datumVon).format('DD.MM')} - {dayjs(ev.datumBis).format('DD.MM.YYYY')}</span>
                        </div>
                      </div>
                    </div>
                    <button 
                      onClick={() => router.push(`/regatta/${ev.id}`)}
                      className="w-full md:w-auto bg-slate-900 hover:bg-blue-600 text-white px-5 py-3 rounded-2xl font-bold text-sm transition-all flex items-center justify-center gap-2 group/btn"
                    >
                      {common('details')} <ChevronRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
          

          {/* Sidebar: Profile Info / Quick Stats */}
          <div className="space-y-6">
            <div className="bg-gradient-to-br from-blue-600 to-blue-800 p-6 rounded-3xl shadow-xl shadow-blue-900/20">
              
              {/* Profilbild Bereich - Korrigiert von 'segler' auf 'account' */}
              <div className="w-24 h-24 rounded-2xl overflow-hidden bg-white/10 flex items-center justify-center mb-4 border border-white/20 shadow-inner">
                {account?.profilbild ? (
                  <img
                    src={account.profilbild}
                    alt="Profilbild"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <UserIcon className="text-blue-200 w-10 h-10" />
                )}
              </div>
                    
              <h3 className="text-xl font-black text-white leading-tight">{t('profileTitle')}</h3>
                        
              {/* ID Bereich mit Kopier-Button */}
              <div className="flex items-center gap-2 mt-1">
                <p className="text-blue-100 text-sm opacity-80 font-mono">
                  ID: {account?.id 
                    ? `${account.id.slice(0, 8)}...` 
                    : common('loading')
                  }
                </p>
                <button 
                  onClick={copyIdToClipboard}
                  className="p-1.5 hover:bg-white/10 rounded-lg transition-colors group relative"
                  title={t('copyId')}
                >
                  {copied ? (
                    <Check className="w-3.5 h-3.5 text-green-400 animate-in zoom-in" />
                  ) : (
                    <Copy className="w-3.5 h-3.5 text-blue-200 group-hover:text-white transition-colors" />
                  )}
                </button>
              </div>
          
              {/* Statistiken */}
              <div className="mt-6 flex justify-between border-t border-white/20 pt-4">
                <div className="text-center">
                  <p className="text-2xl font-black text-white">{events.length}</p>
                  <p className="text-[10px] uppercase font-bold text-blue-200">{t('stats.active')}</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-black text-white">{podiums}</p>
                  <p className="text-[10px] uppercase font-bold text-blue-200">{t('stats.podiums')}</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-black text-white">{activeClasses.size}</p>
                  <p className="text-[10px] uppercase font-bold text-blue-200">{t('stats.classes')}</p>
                </div>
              </div>
            </div>

            {/* ÜBERARBEITETER POSTEINGANG */}
            <div className="bg-[#1e293b] rounded-3xl border border-slate-800 overflow-hidden shadow-2xl">
              <div className="p-6 border-b border-slate-800 bg-slate-800/30 flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-blue-500/10 rounded-lg">
                    <CelebrationIcon className="w-4 h-4 text-blue-400" />
                  </div>
                  <h4 className="text-xs font-black uppercase tracking-widest text-white">{t('inbox')}</h4>
                </div>
                {notifications.length > 0 && (
                  <span className="bg-blue-600 text-[10px] font-black px-2.5 py-1 rounded-full text-white">
                    {notifications.length}
                  </span>
                )}
              </div>
            
              <div className="p-4 space-y-3 max-h-[400px] overflow-y-auto custom-scrollbar">
                {notifications.map((n) => (
              <div key={n.id} className="group p-4 bg-slate-900/40 hover:bg-slate-900/60 rounded-2xl border border-slate-800/50 transition-all">
                <div className="flex justify-between items-start mb-2">
                  <span className="text-[9px] font-black text-blue-400 uppercase tracking-tighter bg-blue-400/10 px-2 py-0.5 rounded">
                    {n.eventId ? t('notification.eventInvite') : t('notification.request')}
                  </span>
                  <span className="text-[9px] text-slate-600 font-mono">
                    {dayjs(n.createdAt || n.timestamp).format('DD.MM.YY')}
                  </span>
                </div>
                
                <p className="text-[11px] text-slate-300 leading-relaxed font-medium mb-4">
                  {n.eventName
                    ? t('notification.invitedToEvent', { name: n.eventName })
                    : t('notification.newContactRequest')}
                </p>
            
                <div className="grid grid-cols-2 gap-2">
                  <button 
                    onClick={() => handleInviteAction(n.id, 'accept')}
                    className="bg-blue-600 hover:bg-blue-500 text-white text-[9px] font-black py-2 rounded-xl transition-all"
                  >
                    {common('accept')}
                  </button>
                  <button 
                    onClick={() => handleInviteAction(n.id, 'decline')}
                    className="bg-slate-800 hover:bg-red-500/20 text-slate-400 text-[9px] font-black py-2 rounded-xl transition-all"
                  >
                    {common('decline')}
                  </button>
                </div>
              </div>
            ))}
              
              {notifications.length > 0 && (
                <div className="p-3 bg-slate-800/20 text-center">
                  <button className="text-[9px] font-black text-slate-500 hover:text-blue-400 transition-colors uppercase tracking-widest">
                    {t('markAllRead')}
                  </button>
                </div>
              )}
            </div>
            </div>
            
             <div className="bg-[#1e293b] p-6 rounded-3xl border border-slate-800">
                <h4 className="text-xs font-black uppercase tracking-widest text-slate-500 mb-4">{t('quickLinks')}</h4>
                <div className="space-y-3">
                   <button 
                      onClick={() => router.push(`/dashboard/segler/${effectiveId}/receipts`)}
                      className="p-2 hover:bg-slate-700 rounded-full transition-colors"
                   >
                        {t('receipts')}
                   </button>
                   <button 
                      onClick={() => router.push(`/dashboard/segler/${effectiveId}/clubEvents`)}
                      className="p-2 hover:bg-slate-700 rounded-full transition-colors"
                   >
                      {t('myClub')}
                   </button>
                </div>
             </div>
          </div>

        </div>
      </main>
    </div>
  );
}

// Hilfskomponente für das Menü
function MenuLink({ icon, label, href }: { icon: any, label: string, href: string }) {
  const router = useRouter();
  return (
    <button 
      onClick={() => router.push(href)}
      className="flex items-center gap-3 w-full px-4 py-3 hover:bg-slate-800 text-slate-200 font-bold transition-colors"
    >
      <span className="w-4 h-4 text-slate-400">{icon}</span>
      {label}
    </button>
  );
}

function calculatePlacement(seglerList: any[], eventResults: Record<string, any[]>, targetId: string) {
  const numParticipants = seglerList.length;
  if (numParticipants === 0) return null;

  const targetIdStr = String(targetId).trim();

  const scoredSegler = seglerList.map(entry => {
    const sId = String(entry.skipper?.seglerId || entry.seglerId || "").trim();
    // Ergebnisse abrufen: Wir probieren sowohl die ID als auch "normalisierte" Keys
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
