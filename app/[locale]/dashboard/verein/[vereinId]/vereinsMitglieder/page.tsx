'use client';

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { 
  ArrowLeft, Users, Mail, UserPlus, Trash2, Send, Bell, Loader2
} from "lucide-react";
import { useRouter } from "@/navigation";
import { useTranslations } from 'next-intl';

type Mitglied = { id: string; name: string; email?: string; rolle?: string; vorname?: string; nachname?: string; nation?: string };
type Anfrage = { 
  id: string; 
  userId: string; 
  message: string; 
  timestamp: string; 
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  userName?: string;
  userNation?: string;
  userYear?: string;
  userEmail?: string;
};

export default function VereinsMitgliederPage() {
  const t = useTranslations("VereinsMitglieder");
  const params = useParams();
  const vereinId = params?.vereinId as string;
  const router = useRouter();

  const [mitglieder, setMitglieder] = useState<Mitglied[]>([]);
  const [anfragen, setAnfragen] = useState<Anfrage[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (vereinId) loadData();
  }, [vereinId]);

  async function loadData() {
    try {
      setLoading(true);
      const resMembers = await fetch(`/api/clubs/members?clubId=${vereinId}`);
      if (resMembers.ok) setMitglieder(await resMembers.json());

      const resRequests = await fetch(`/api/clubs/requests?clubId=${vereinId}`);
      if (resRequests.ok) {
        const requestsData = await resRequests.json();
        setAnfragen(requestsData.filter((a: Anfrage) => a.status === 'PENDING'));
      }
    } catch (err) {
      console.error("Fehler beim Laden der Vereinsdaten:", err);
    } finally {
      setLoading(false);
    }
  }

  const sendBroadcast = async () => {
    if (!message.trim()) return;
    try {
      const res = await fetch('/api/clubs/broadcasts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clubId: vereinId, message })
      });
      if (res.ok) {
        alert(t('broadcastSuccess'));
        setMessage("");
      } else alert(t('broadcastError'));
    } catch (err) {
      console.error("Broadcast failed:", err);
    }
  };

  const handleAction = async (requestId: string, action: 'APPROVE' | 'REJECT') => {
    const requestToProcess = anfragen.find(a => a.id === requestId);
    if (!requestToProcess) return;

    try {
      const endpoint = action === 'APPROVE' ? 'approve' : 'reject';
      const res = await fetch(`/api/clubs/requests/${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestId, clubId: vereinId, userId: requestToProcess.userId })
      });
      if (res.ok) {
        setAnfragen(prev => prev.filter(a => a.id !== requestId));
        if (action === 'APPROVE') loadData();
      } else {
        const err = await res.json();
        alert("Fehler: " + err.error);
      }
    } catch (err) {
      console.error("Action failed:", err);
    }
  };

  const removeMember = async (userId: string) => {
    if (!confirm(t('confirmRemove'))) return;
    try {
      const res = await fetch(`/api/clubs/members/remove`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clubId: vereinId, userId })
      });
      if (res.ok) setMitglieder(prev => prev.filter(m => m.id !== userId));
      else {
        const err = await res.json();
        alert("Fehler: " + err.error);
      }
    } catch (err) {
      console.error("Entfernen fehlgeschlagen:", err);
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-[#0f172a] flex flex-col items-center justify-center text-white font-black italic uppercase tracking-widest text-xs">
      <Loader2 className="w-8 h-8 animate-spin text-blue-500 mb-4" />
      {t('loading')}
    </div>
  );

  // Hilfsvariablen für die gesplittete Überschrift
  const crewRosterText = t('crewRoster').split(' ');
  const firstWord = crewRosterText[0];
  const secondWord = crewRosterText.slice(1).join(' ');

  return (
    <div className="min-h-screen bg-[#0f172a]/90 text-slate-200 pb-20 font-sans">
      <nav className="sticky top-0 z-50 bg-[#1e293b]/80 backdrop-blur-xl border-b border-slate-700/50 text-white px-6 h-16 flex justify-between items-center">
        <button onClick={() => router.back()} className="flex items-center gap-2 text-[10px] font-black hover:text-blue-400 uppercase italic transition-all">
          <ArrowLeft className="w-4 h-4" /> {t('back')}
        </button>
        <div className="flex items-center gap-2 text-blue-500 font-black italic uppercase text-[10px] tracking-widest">
          <Users className="w-4 h-4" /> {t('clubManagement')}
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-6 pt-12">
        <header className="mb-12">
          <h1 className="text-6xl font-black text-white italic uppercase tracking-tighter mb-2">
            {firstWord} <span className="text-blue-600">{secondWord}</span>
          </h1>
          <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.3em]">
            {t('registryId', { vereinId })}
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          <div className="lg:col-span-2 space-y-10">

            {/* BROADCAST */}
            <section className="bg-slate-800/30 border border-slate-700/50 rounded-[2rem] p-8">
              <h2 className="text-white font-black uppercase italic mb-6 flex items-center gap-2 text-xs tracking-widest">
                <Bell className="w-4 h-4 text-blue-500" /> {t('broadcast')}
              </h2>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder={t('broadcastPlaceholder')}
                className="w-full bg-slate-900/50 border border-slate-700 rounded-2xl p-5 text-xs font-bold text-white placeholder:text-slate-700 outline-none focus:border-blue-500 transition-all min-h-[100px] mb-4"
              />
              <button
                onClick={sendBroadcast}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-8 py-3 rounded-xl text-[10px] font-black uppercase italic transition-all ml-auto"
              >
                <Send className="w-3 h-3" /> {t('broadcastSend')}
              </button>
            </section>

            {/* MITGLIEDER-LISTE */}
            <section>
              <h2 className="text-blue-400 font-black uppercase italic mb-6 flex items-center gap-2 text-xs tracking-widest">
                <Users className="w-4 h-4" /> {t('activeMembers', { count: mitglieder.length })}
              </h2>
              <div className="grid gap-3">
                {mitglieder.length > 0 ? (
                  mitglieder.map((m: Mitglied) => {
                    const displayName = m.vorname && m.nachname
                      ? `${m.vorname} ${m.nachname}`
                      : (m.vorname || m.email || t('noMembers'));
                    const initial = displayName.charAt(0).toUpperCase();
                    return (
                      <div key={m.id} className="bg-[#1e293b] border border-slate-700/50 p-5 rounded-2xl flex items-center justify-between group hover:border-blue-500/30 transition-all">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center font-black text-blue-500 border border-slate-700 uppercase italic">
                            {initial}
                          </div>
                          <div>
                            <p className="text-white font-black uppercase italic text-sm">{displayName}</p>
                            <p className="text-slate-500 text-[9px] font-bold uppercase tracking-widest">
                              {m.nation || t('noNation')} • {m.email}
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => removeMember(m.id)}
                          className="p-2 text-slate-700 hover:text-red-500 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    );
                  })
                ) : (
                  <div className="bg-slate-800/20 border border-dashed border-slate-700 p-10 rounded-2xl text-center">
                    <p className="text-slate-500 text-xs font-black uppercase italic">{t('noMembers')}</p>
                  </div>
                )}
              </div>
            </section>
          </div>

          {/* SIDEBAR: ANFRAGEN */}
          <aside className="space-y-6">
            <div className="bg-blue-600/5 border border-blue-600/20 p-8 rounded-[2.5rem]">
              <h3 className="text-white font-black uppercase italic text-xs mb-8 flex items-center gap-2 tracking-widest">
                <UserPlus className="w-4 h-4 text-blue-500" /> {t('joinRequests')}
              </h3>

              <div className="space-y-4">
                {anfragen.length > 0 ? (
                  anfragen.map((a: Anfrage) => (
                    <div key={a.id} className="bg-slate-900/80 p-5 rounded-2xl border border-white/5 hover:border-blue-500/30 transition-all">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h4 className="text-white font-black uppercase italic text-[11px] leading-tight">
                            {a.userName}
                          </h4>
                          <p className="text-blue-500 text-[9px] font-bold uppercase tracking-widest mt-0.5">
                            {a.userNation} • {t('born')} {a.userYear}
                          </p>
                        </div>
                        <div className="bg-blue-600/10 px-2 py-1 rounded border border-blue-600/20">
                          <span className="text-[8px] text-blue-400 font-mono italic">
                            {new Date(a.timestamp).toLocaleDateString()}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 mb-4 text-slate-500">
                        <Mail size={10} className="text-slate-700" />
                        <span className="text-[9px] font-medium">{a.userEmail}</span>
                      </div>

                      <div className="bg-black/20 rounded-xl p-3 border border-white/5 mb-5">
                        <p className="text-slate-400 text-[10px] italic leading-relaxed">
                          "{a.message}"
                        </p>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <button
                          onClick={() => handleAction(a.id, 'APPROVE')}
                          className="bg-blue-600 hover:bg-blue-500 text-white py-2.5 rounded-lg text-[9px] font-black uppercase italic transition-all"
                        >
                          {t('approve')}
                        </button>
                        <button
                          onClick={() => handleAction(a.id, 'REJECT')}
                          className="bg-slate-800 hover:bg-red-600 text-white py-2.5 rounded-lg text-[9px] font-black uppercase italic transition-all"
                        >
                          {t('reject')}
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-10 opacity-30">
                    <p className="text-[9px] uppercase font-black italic">{t('noRequests')}</p>
                  </div>
                )}
              </div>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}