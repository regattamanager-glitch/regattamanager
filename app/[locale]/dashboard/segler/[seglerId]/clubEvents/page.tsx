'use client';

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { 
  ArrowLeft, Calendar, MapPin, Search, 
  Bell, Users, Plus, ShieldCheck, Check, AlertCircle, Clock
} from "lucide-react";
import { useRouter } from '@/navigation';
import { useTranslations } from "next-intl";

type Club = {
  id: string;
  name: string;
  kuerzel: string;
  logo?: string;
  istPrivat: boolean;
};

type ClubContent = {
  events: any[];
  nachrichten: any[];
};

export default function ClubEventsPage() {
  const t = useTranslations("Clubs");
  const common = useTranslations("Common");
  const params = useParams();
  const seglerId = params?.seglerId as string;
  const router = useRouter();

  const [myClubs, setMyClubs] = useState<Club[]>([]);
  const [allClubs, setAllClubs] = useState<Club[]>([]);
  const [content, setContent] = useState<ClubContent>({ events: [], nachrichten: [] }); 
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'my_clubs' | 'discover'>('my_clubs');
  const [searchTerm, setSearchTerm] = useState("");

  const [error, setError] = useState<string | null>(null);
  const [submittingId, setSubmittingId] = useState<string | null>(null);
  const [sentRequests, setSentRequests] = useState<string[]>([]);

  const filteredClubs = allClubs.filter((club: Club) => 
    club.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    club.kuerzel.toLowerCase().includes(searchTerm.toLowerCase())
  );

  async function loadData() {
    try {
      setLoading(true);
      setError(null);
      
      const [resAcc, resClubs, resBroadcasts] = await Promise.all([
        fetch('/api/accounts'),
        fetch('/api/content/clubs'),
        fetch('/api/clubs/broadcasts')
      ]);
      
      if (!resAcc.ok || !resClubs.ok) throw new Error("Basisdaten fehlen");

      const accounts = await resAcc.json();
      const clubs = await resClubs.json();
      const allBroadcasts = resBroadcasts.ok ? await resBroadcasts.json() : [];
      
      const me = accounts.find((a: any) => String(a.id) === String(seglerId));
      const myClubIds = me?.vereine || [];

      const joined = clubs.filter((c: any) => myClubIds.includes(c.id));
      const others = clubs.filter((c: any) => !myClubIds.includes(c.id));
      
      setMyClubs(joined);
      setAllClubs(others);

      const myMessages = allBroadcasts
        .filter((b: any) => myClubIds.includes(b.clubId))
        .map((b: any) => {
          const club = joined.find((c: any) => c.id === b.clubId);
          return {
            id: b.id,
            clubName: club?.name || t('fallbackClubName'),
            datum: new Date(b.timestamp).toLocaleDateString(),
            titel: b.message
          };
        })
        .sort((a: any, b: any) => b.timestamp - a.timestamp);

      if (myClubIds.length > 0) {
        const resContent = await fetch(`/api/clubs/content?ids=${myClubIds.join(',')}`);
        if (resContent.ok) {
          const data = await resContent.json();
          setContent({
            events: data.events || [],
            nachrichten: [...myMessages, ...(data.nachrichten || [])]
          });
        } else {
          setContent(prev => ({ ...prev, nachrichten: myMessages }));
        }
      }
    } catch (err) {
      console.error("Fehler beim Laden:", err);
      setError(t('errorLoading'));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { 
    if (seglerId) loadData(); 
  }, [seglerId]);

  const joinClubRequest = async (clubId: string) => {
    setSubmittingId(clubId);
    setError(null);
    try {
      const res = await fetch(`/api/clubs/${clubId}/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          userId: seglerId, 
          message: "Beitrittsanfrage via Portal" 
        })
      });

      if (res.ok) {
        setSentRequests(prev => [...prev, clubId]);
      } else {
        const data = await res.json();
        throw new Error(data.error || t('errorSending'));
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmittingId(null);
    }
  };

  if (loading) return <div className="min-h-screen bg-[#0f172a] flex items-center justify-center text-white font-black italic">{t('loading')}</div>;

  return (
    <div className="min-h-screen bg-[#0f172a]/90 md:rounded-[2.5rem] text-slate-200 pb-20 font-sans">
      <nav className="sticky top-0 z-50 bg-[#1e293b]/80 md:rounded-[2.5rem] backdrop-blur-xl border-b border-slate-700/50 text-white">
        <div className="max-w-5xl mx-auto px-6 h-16 flex justify-between items-center">
          <button onClick={() => router.back()} className="flex items-center gap-2 text-sm font-black hover:text-blue-400 uppercase italic transition-colors">
            <ArrowLeft className="w-4 h-4" /> {common('dashboard')}
          </button>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-blue-500" />
            <span className="text-[10px] font-black uppercase tracking-widest">{t('portalTitle')}</span>
          </div>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-6 pt-12">
        <header className="mb-10">
          <h1 className="text-6xl font-black text-white italic uppercase tracking-tighter mb-8">
            Club <span className="text-blue-600">Life</span>
          </h1>

          <div className="flex gap-4">
            <button onClick={() => setActiveTab('my_clubs')} className={`px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'my_clubs' ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'bg-slate-800 text-slate-500'}`}>
              {t('tabs.myClub')} ({myClubs.length})
            </button>
            <button onClick={() => setActiveTab('discover')} className={`px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'discover' ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-500'}`}>
              {t('tabs.discover')}
            </button>
          </div>
        </header>

        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-400 text-xs font-bold uppercase italic flex items-center gap-2 animate-pulse">
            <AlertCircle size={14} /> {error}
          </div>
        )}

        {activeTab === 'my_clubs' ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
            <div className="lg:col-span-2 flex flex-col"> 
              <section className="mb-12">
                <h2 className="text-blue-400 font-black uppercase italic mb-8 flex items-center gap-2 tracking-[0.2em] text-[10px]">
                  <Bell className="w-5 h-5 text-blue-500" /> {t('sections.news')}
                </h2>
                <div className="space-y-6">
                  {content.nachrichten?.length > 0 ? (
                    content.nachrichten.map((msg: any) => (
                      <div key={msg.id || msg.titel} className={`p-6 bg-slate-800/40 border-l-4 rounded-r-3xl transition-all shadow-lg ${msg.titel === "Wichtige Durchsage" ? "border-amber-500 bg-amber-500/5" : "border-blue-600"}`}>
                        <div className="flex justify-between items-start mb-3">
                          <span className={`text-[10px] font-black uppercase tracking-widest ${msg.titel === "Wichtige Durchsage" ? "text-amber-500" : "text-blue-400"}`}>
                            {msg.clubName}
                          </span>
                          <span className="text-[9px] text-slate-600 font-mono bg-black/20 px-2 py-1 rounded">{msg.datum}</span>
                        </div>
                        <p className="text-white font-black italic uppercase text-md mb-2">{msg.titel}</p>
                      </div>
                    ))
                  ) : (
                    <div className="p-10 border border-dashed border-slate-800 rounded-[2rem] text-center">
                       <p className="text-slate-600 text-[10px] uppercase font-black italic">{t('noNews')}</p>
                    </div>
                  )}
                </div>
              </section>

              <section className="mt-24 border-t border-slate-800/50 pt-16"> 
                <h2 className="text-blue-400 font-black uppercase italic mb-10 flex items-center gap-2 tracking-[0.2em] text-[10px]">
                  <Calendar className="w-5 h-5 text-blue-500" /> {t('sections.dates')}
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {content.events?.length > 0 ? (
                    content.events.map((event: any) => (
                      <div key={event.id || event.titel} onClick={() => (event.id || event.regattaId) && router.push(`/regatta/${event.id || event.regattaId}`)} className="p-6 bg-[#1e293b] rounded-[2rem] border border-slate-700 transition-all group shadow-lg cursor-pointer hover:border-blue-500/50 hover:bg-[#243347]">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-2 text-blue-500">
                            <Clock className="w-4 h-4" />
                            <span className="text-[10px] font-black tracking-widest">{event.datum}</span>
                          </div>
                        </div>
                        <h4 className="text-white font-black italic uppercase text-lg leading-tight mb-3">{event.titel}</h4>
                        <p className="text-slate-500 text-[10px] uppercase font-black flex items-center gap-1"><MapPin className="w-3 h-3" /> {event.ort}</p>
                      </div>
                    ))
                  ) : (
                    <div className="col-span-full p-10 border border-dashed border-slate-800 rounded-[2rem] text-center">
                      <p className="text-slate-600 text-[10px] uppercase font-black italic">{t('noDates')}</p>
                    </div>
                  )}
                </div>
              </section>
            </div>

            <aside className="space-y-6">
              <div className="bg-blue-600/10 border border-blue-500/20 p-8 rounded-[2.5rem]">
                <h3 className="text-white font-black uppercase italic text-sm mb-6 flex items-center gap-2">
                  <Users className="w-5 h-5 text-blue-500" /> {t('sidebar.memberships')}
                </h3>
                {myClubs.length > 0 ? (
                  myClubs.map(club => (
                    <div key={club.id} className="flex items-center gap-3 mb-4 last:mb-0">
                      <div className="w-10 h-10 bg-slate-800 rounded-xl flex items-center justify-center font-black text-blue-500 border border-slate-700 uppercase">{club.kuerzel}</div>
                      <div>
                        <p className="text-white text-xs font-black uppercase italic">{club.name}</p>
                        <span className="text-[8px] text-green-500 font-black uppercase tracking-tighter">{t('sidebar.statusActive')}</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-slate-500 text-[10px] uppercase font-black italic">{t('sidebar.noClubs')}</p>
                )}
              </div>
            </aside>
          </div>
        ) : (
          <div className="space-y-8">
            <div className="relative max-w-md">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input 
                type="text"
                placeholder={t('searchPlaceholder')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-slate-800/50 border border-slate-700 rounded-2xl py-4 pl-12 pr-4 text-xs font-black uppercase tracking-widest focus:border-blue-500 outline-none transition-all"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredClubs.map(club => (
                <div key={club.id} className="group p-6 bg-[#1e293b] rounded-[2rem] border border-slate-700 flex flex-col justify-between hover:border-blue-500/50 transition-all shadow-xl">
                  <div onClick={() => router.push(`/dashboard/segler/${seglerId}/clubEvents/profil?clubId=${club.id}`)} className="cursor-pointer">
                    <div className="flex justify-between items-start mb-4">
                      <div className="w-16 h-16 bg-slate-800 rounded-2xl flex items-center justify-center text-2xl font-black text-blue-500 border border-slate-700 group-hover:scale-105 transition-transform">{club.kuerzel}</div>
                      <div className="bg-slate-900/50 p-2 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity"><ArrowLeft className="w-4 h-4 rotate-180 text-blue-500" /></div>
                    </div>
                    <h3 className="text-white font-black italic uppercase text-xl leading-tight group-hover:text-blue-400 transition-colors">{club.name}</h3>
                    <p className="text-slate-500 text-[10px] font-bold uppercase mt-2 flex items-center gap-2"><Clock className="w-3 h-3" /> {t('onInvitationOnly')}</p>
                  </div>

                  <button 
                    onClick={(e) => { e.stopPropagation(); if (!sentRequests.includes(club.id) && submittingId !== club.id) joinClubRequest(club.id); }}
                    disabled={sentRequests.includes(club.id) || submittingId === club.id}
                    className={`mt-6 w-full py-3 rounded-xl text-[10px] font-black uppercase italic transition-all flex items-center justify-center gap-2 border ${sentRequests.includes(club.id) ? "bg-green-500/10 text-green-400 border-green-500/20" : "bg-blue-600/10 hover:bg-blue-600 text-blue-400 hover:text-white border-blue-600/20"}`}
                  >
                    {submittingId === club.id ? (
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : sentRequests.includes(club.id) ? (
                      <><Check className="w-4 h-4" /> {t('buttons.sent')}</>
                    ) : (
                      <><Plus className="w-4 h-4" /> {t('buttons.requestMembership')}</>
                    )}
                  </button>
                </div>
              ))}
            </div>
          </div> 
        )}
      </main>
    </div>
  );
}