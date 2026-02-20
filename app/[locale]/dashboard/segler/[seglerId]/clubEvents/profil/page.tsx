'use client';

import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import Image from "next/image";
import { 
  ArrowLeft, MapPin, Users, 
  Globe, Mail, Ship, Anchor, Check 
} from "lucide-react";
import { useRouter } from '@/navigation';
import { useTranslations } from "next-intl";

type ClubDetails = {
  id: string;
  name: string;
  kuerzel: string;
  beschreibung?: string;
  location?: string;
  website?: string;
  email?: string;
  mitgliederAnzahl?: number;
  gegruendet?: string;
  istPrivat: boolean;
  logo?: string;
};

export default function ClubProfilPage() {
  const t = useTranslations("ClubProfile");
  const common = useTranslations("Common");
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const seglerId = params?.seglerId as string;
  const clubId = searchParams.get("clubId"); 

  const [club, setClub] = useState<ClubDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [requestSent, setRequestSent] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!clubId) return;
    async function fetchClubData() {
      try {
        setLoading(true);
        const res = await fetch('/api/content/clubs');
        const allClubs = await res.json();
        const found = allClubs.find((c: any) => String(c.id) === String(clubId));
        if (found) setClub(found);
      } catch (err) {
        console.error("Fehler beim Laden:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchClubData();
  }, [clubId]);

  const handleJoinRequest = async () => {
    if (!club || !seglerId) return;
    
    setIsSubmitting(true);
    setError(null);

    try {
      const res = await fetch(`/api/clubs/${club.id}/join`, { 
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          userId: seglerId,
          message: `Ich möchte gerne dem Verein ${club.name} beitreten.` 
        })
      });
      
      const data = await res.json();
      if (res.ok) {
        setRequestSent(true);
      } else {
        throw new Error(data.error || "Server-Fehler");
      }
    } catch (err: any) {
      setError(err.message || "Anfrage fehlgeschlagen.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-[#0f172a] flex flex-col items-center justify-center text-white font-sans uppercase tracking-[0.3em] italic text-xs">
      <div className="w-12 h-12 border-2 border-cyan-500/20 border-t-cyan-400 rounded-full animate-spin mb-4" />
      {t('syncing')}
    </div>
  );

  if (!club) return (
    <div className="min-h-screen bg-[#0f172a] flex flex-col items-center justify-center text-white text-center">
      <div className="text-white/20 font-black text-6xl mb-4">404</div>
      <p className="italic uppercase font-bold tracking-widest">{t('notFound')}</p>
      <button onClick={() => router.back()} className="mt-8 px-6 py-2 border border-white/10 rounded-full text-cyan-400 hover:bg-white/5 transition-all uppercase text-xs font-black">
        {t('returnPort')}
      </button>
    </div>
  );

  return (
    <div className="min-h-screen w-full bg-[#0f172a]/90 md:rounded-[2.5rem] flex flex-col items-center p-6 md:p-10 font-sans selection:bg-cyan-500/30">
      
      <div className="w-full max-w-6xl mb-6 flex items-center">
        <button 
          onClick={() => router.back()}
          className="group flex items-center gap-3 px-5 py-2.5 rounded-2xl bg-white/5 border border-white/10 text-white/70 hover:text-white hover:bg-white/10 transition-all backdrop-blur-md"
        >
          <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
          <span className="text-xs font-bold uppercase tracking-widest">{t('backToFleet')}</span>
        </button>
      </div>

      <div className="w-full max-w-6xl rounded-3xl bg-white/5 backdrop-blur-2xl border border-white/10 p-10 shadow-[0_0_60px_rgba(0,200,255,0.15)] relative overflow-hidden">
        
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-cyan-500/5 blur-[100px] rounded-full pointer-events-none" />

        <div className="flex items-center justify-between mb-12">
          <div className="text-white/40 text-[10px] font-mono uppercase tracking-widest">
            ORG_REF: {club.kuerzel} // ID: {club.id.slice(0, 8).toUpperCase()}
          </div>

          <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
            <div className="px-4 py-1 text-[10px] font-black rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-400/20 uppercase tracking-[0.2em]">
              {club.istPrivat ? t('status.protected') : t('status.open')}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          <div className="col-span-1 space-y-8">
            <div className="rounded-2xl bg-white/5 border border-white/10 p-6 backdrop-blur-md">
              <div className="relative w-full aspect-square rounded-xl overflow-hidden bg-[#0a0f1d] mb-6 shadow-2xl border border-white/5 group">
                {club.logo ? (
                  <Image src={club.logo} alt="club logo" fill className="object-cover group-hover:scale-105 transition-transform duration-700" />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-slate-900 to-blue-950">
                    <Anchor className="w-16 h-16 text-cyan-500/20 mb-2" />
                    <span className="text-5xl font-black italic text-cyan-500/40 uppercase tracking-tighter">{club.kuerzel}</span>
                  </div>
                )}
              </div>
              <div className="flex justify-center">
                <span className="text-[9px] px-4 py-1 rounded-full bg-white/5 text-white/40 border border-white/10 font-bold uppercase tracking-[0.2em]">
                   {t('officialRegistry')}
                </span>
              </div>
            </div>

            <div className="rounded-2xl bg-white/5 border border-white/10 p-6 backdrop-blur-md border-t-cyan-500/20">
              <div className="text-white/30 text-[10px] font-black uppercase tracking-[0.3em] mb-6 italic">{t('actionTitle')}</div>
              
              <button 
                onClick={handleJoinRequest}
                disabled={requestSent || isSubmitting}
                className={`w-full py-4 rounded-xl font-black uppercase italic transition-all duration-500 shadow-xl text-xs flex items-center justify-center gap-3 active:scale-95 ${
                  requestSent 
                    ? "bg-green-500/10 text-green-400 border border-green-500/20 cursor-default" 
                    : "bg-blue-600 hover:bg-blue-500 text-white shadow-blue-600/20 border border-blue-400/30"
                }`}
              >
                {isSubmitting ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : requestSent ? (
                  <>
                    <Check size={18} className="animate-bounce" />
                    <span>{t('buttons.sent')}</span>
                  </>
                ) : (
                  <>
                    <Ship size={18} className="group-hover:rotate-12 transition-transform" />
                    <span>{t('buttons.apply')}</span>
                  </>
                )}
              </button>

              {requestSent && (
                <p className="text-[10px] text-green-400/50 mt-4 text-center font-bold uppercase tracking-widest animate-pulse leading-tight">
                  {t('awaitingApproval')}
                </p>
              )}
            </div>
          </div>

          <div className="col-span-2">
            <div className="mb-12">
              <div className="text-white/30 text-[10px] uppercase tracking-[0.5em] mb-4 font-black italic">
                {t('recordLabel')}
              </div>

              <h1 className="text-5xl md:text-6xl font-light text-white leading-none tracking-tight">
                {club.name.split(' ').slice(0, -1).join(' ')}
              </h1>

              <h2 className="text-7xl md:text-8xl font-black text-cyan-400 leading-[0.8] uppercase tracking-tighter italic mt-1">
                {club.name.split(' ').slice(-1)}
              </h2>
            </div>

            <div className="mb-12 p-8 rounded-2xl bg-white/[0.03] border-l-4 border-cyan-400 backdrop-blur-md">
               <p className="text-lg md:text-xl text-slate-300 leading-relaxed italic font-medium">
                 "{club.beschreibung || t('defaultDescription')}"
               </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {infoCard(t('fields.port'), club.location || t('fallback.location'), <MapPin size={14} />, t)}
              {infoCard(t('fields.callsign'), club.kuerzel, <Ship size={14} />, t)}
              {infoCard(t('fields.crew'), club.mitgliederAnzahl?.toString() || t('fallback.restricted'), <Users size={14} />, t)}
              {infoCard(t('fields.registry'), club.gegruendet || t('fallback.era'), <Anchor size={14} />, t)}
              {infoCard(t('fields.comm'), club.website || "n/a", <Globe size={14} />, t)}
              {infoCard(t('fields.inbox'), club.email || t('fallback.private'), <Mail size={14} />, t)}
            </div>
          </div>
        </div>

        <div className="mt-16 text-center text-white/20 text-[10px] font-bold uppercase tracking-[0.6em] relative">
          <div className="absolute left-0 top-1/2 w-1/4 h-px bg-white/5" />
          {t('footerLabel')}
          <div className="absolute right-0 top-1/2 w-1/4 h-px bg-white/5" />
        </div>
      </div>
    </div>
  );
}

function infoCard(title: string, value: string, icon: React.ReactNode, t: any) {
  return (
    <div className="rounded-2xl bg-white/5 border border-white/10 p-6 backdrop-blur-md hover:bg-white/10 hover:border-cyan-500/30 transition-all duration-500 group">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-cyan-400/30 group-hover:text-cyan-400 transition-colors">
          {icon}
        </span>
        <div className="text-white/30 text-[9px] font-black uppercase tracking-[0.2em] group-hover:text-cyan-400/50 transition-colors">
          {title}
        </div>
      </div>
      <div className="text-white font-bold truncate tracking-wide italic text-sm md:text-base">
        {value}
      </div>
    </div>
  );
}