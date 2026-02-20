'use client';

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import { ArrowLeft } from "lucide-react";
import { useRouter } from "@/navigation";
import { useTranslations } from "next-intl";

type UserProfile = {
  id: string;
  vorname: string;
  nachname: string;
  nation?: string;
  email?: string;
  worldSailingId?: string;
  instagram?: string;
  profilbild?: string;
  type: string;
};

export default function ProfilePage() {
  const t = useTranslations("Profile");
  const params = useParams();
  const router = useRouter();
  
  const profileId = params?.id as string;

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadProfile() {
      try {
        const res = await fetch('/api/accounts');
        const accounts = await res.json(); 
        const found = accounts.find((a: any) => String(a.id) === String(profileId));
        setProfile(found || null);
      } catch (err) {
        console.error("Error loading profile:", err);
      } finally {
        setLoading(false);
      }
    }
    if (profileId) loadProfile();
  }, [profileId]);

  if (loading) return <div className="min-h-screen bg-[#0f172a] flex items-center justify-center text-white">{t('loading')}</div>;
  
  if (!profile) return (
    <div className="min-h-screen bg-[#0f172a] flex flex-col items-center justify-center text-white text-center">
      {t('notFound')}
      <button onClick={() => router.back()} className="mt-4 text-blue-400">{t('back')}</button>
    </div>
  );

  return (
    <div className="min-h-screen w-full bg-[#0f172a]/90 md:rounded-[2.5rem] flex flex-col items-center p-6 md:p-10 font-sans">
      
      {/* Navigation */}
      <div className="w-full max-w-6xl mb-6 flex items-center">
        <button 
          onClick={() => router.back()}
          className="group flex items-center gap-3 px-5 py-2.5 rounded-2xl bg-white/5 border border-white/10 text-white/70 hover:text-white hover:bg-white/10 transition-all backdrop-blur-md"
        >
          <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
          <span className="text-xs font-bold uppercase tracking-widest">{t('backToCrew')}</span>
        </button>
      </div>

      <div className="w-full max-w-6xl rounded-3xl bg-white/5 backdrop-blur-2xl border border-white/10 p-10 shadow-[0_0_60px_rgba(0,200,255,0.15)]">

        {/* Header Label Row */}
        <div className="flex items-center justify-between mb-10">
          <div className="text-white/40 text-xs font-mono uppercase">
            {t('regFile')}: #{profile.id.slice(-6).toUpperCase()} &nbsp; | &nbsp; {t('statusLabel')}: {t('statusActive')}
          </div>

          <div className="px-4 py-1 text-[10px] font-black rounded-full bg-blue-500/20 text-blue-300 border border-blue-400/20 uppercase tracking-widest">
            {profile.type}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">

          {/* LEFT COLUMN */}
          <div className="col-span-1 space-y-6">
            <div className="rounded-2xl bg-white/5 border border-white/10 p-6 backdrop-blur-md">
              <div className="relative w-full aspect-square rounded-xl overflow-hidden bg-black/40 mb-4 shadow-2xl">
                <Image
                  src={profile.profilbild || "/placeholder-user.jpg"}
                  alt="profile"
                  fill
                  className="object-cover"
                />
              </div>

              <div className="flex justify-end">
                <span className="text-[10px] px-3 py-1 rounded-full bg-green-500/20 text-green-400 border border-green-400/20 font-bold uppercase tracking-tighter">
                  {t('verifiedAthlete')}
                </span>
              </div>
            </div>

            <div className="rounded-2xl bg-white/5 border border-white/10 p-6 backdrop-blur-md">
              <div className="text-white/40 text-[10px] font-bold uppercase tracking-widest mb-2">{t('internalStatus')}</div>
              <div className="text-white font-medium flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                {t('registry')}: {t('active')}
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN */}
          <div className="col-span-2">
            <div className="mb-10">
              <div className="text-white/40 text-xs uppercase tracking-[0.4em] mb-3 font-bold">
                {t('profileSubline')}
              </div>

              <h1 className="text-5xl md:text-6xl font-light text-white leading-tight">
                {profile.vorname}
              </h1>

              <h2 className="text-7xl md:text-8xl font-black text-cyan-400 leading-[0.8] uppercase tracking-tighter italic">
                {profile.nachname}
              </h2>
            </div>

            {/* Info Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {infoCard(t('labelNation'), profile.nation || t('notAvailable'))}
              {infoCard(t('labelWorldSailing'), profile.worldSailingId || t('notRegistered'))}
              {infoCard(t('labelEmail'), profile.email || t('privateRecord'))}
              {infoCard(t('labelInstagram'), profile.instagram ? `${profile.instagram}` : t('notAvailable'))}
              {infoCard(t('labelAccountType'), profile.type)}
              {infoCard(t('labelDatabaseId'), profile.id)}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-14 text-center text-white/40 text-[10px] font-bold uppercase tracking-[0.5em] relative">
          <div className="absolute left-0 top-1/2 w-1/5 h-px bg-white/10" />
          {t('footerText')}
          <div className="absolute right-0 top-1/2 w-1/5 h-px bg-white/10" />
        </div>

      </div>
    </div>
  );
}

function infoCard(title: string, value: string) {
  return (
    <div className="rounded-2xl bg-white/5 border border-white/10 p-5 backdrop-blur-md hover:bg-white/10 transition-all duration-300 group">
      <div className="text-white/30 text-[9px] font-bold uppercase tracking-widest mb-1 group-hover:text-cyan-400/50 transition-colors">{title}</div>
      <div className="text-white font-medium truncate tracking-wide">{value}</div>
    </div>
  );
}